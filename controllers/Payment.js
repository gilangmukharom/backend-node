const chargeTransaction = async (req, res) => {
  const {
    payment_type,

    subscription_id,

    admin_full_name,
    admin_email,
    admin_phone,
    company_name,
    company_email,
    personnel_quota,
  } = req.body;

  let paymentTypeChoose = "";
  let bankChoose = "permata";
  let cstoreChoose = "indomaret";
  let fee = 0;
  let unitChoose = "hour";
  let expiredTimeChoose = 24;

  try {
    switch (payment_type) {
      case "bca_va":
        paymentTypeChoose = "bank_transfer";
        bankChoose = "bca";
        fee = 5000;
        break;
      case "bni_va":
        paymentTypeChoose = "bank_transfer";
        bankChoose = "bni";
        fee = 5000;
        break;
      case "bri_va":
        paymentTypeChoose = "bank_transfer";
        bankChoose = "bri";
        fee = 5000;
        break;
      case "permata_va":
        paymentTypeChoose = "bank_transfer";
        bankChoose = "permata";
        fee = 5000;
        break;
      case "mandiri_va":
        paymentTypeChoose = "echannel";
        fee = 5000;
        break;
      case "gopay_online":
        paymentTypeChoose = "gopay";
        fee = 2000;
        unitChoose = "minute";
        expiredTimeChoose = 10;
        break;
      case "shopeepay":
        paymentTypeChoose = "shopeepay";
        fee = 2000;
        unitChoose = "minute";
        expiredTimeChoose = 10;
        break;
      case "alfamart":
        paymentTypeChoose = "cstore";
        cstoreChoose = "alfamart";
        fee = 5000;
        break;
      case "indomaret":
        paymentTypeChoose = "cstore";
        cstoreChoose = "indomaret";
        fee = 5000;
        break;
      default:
        break;
    }

    const subscription_item = await SubscriptionItem.findOne({
      where: { id: subscription_id },
    });

    const transactionData = {
      payment_type: paymentTypeChoose,
      echannel: {
        bill_info1: "Payment:",
        bill_info2: "Online purchase",
      },
      bank_transfer: {
        bank: bankChoose,
      },
      cstore: {
        store: cstoreChoose,
        message: "Message to display",
      },
      transaction_details: {
        order_id: `ngab${moment().format("YYYY-MM-DD-HHMMSS")}`,
        gross_amount: subscription_item.price * personnel_quota + fee,
      },
      item_details: [
        {
          id: "a01",
          price: subscription_item.price,
          quantity: personnel_quota,
          name: subscription_item.name,
        },
        {
          id: "b02",
          price: fee,
          quantity: 1,
          name: "Biaya Admin",
        },
      ],
      customer_details: {
        first_name: admin_full_name,
        email: admin_email,
        phone: admin_phone,
        billing_address: {
          first_name: company_name,
          email: company_email,
        },
      },
      custom_expiry: {
        expiry_duration: expiredTimeChoose,
        unit: unitChoose,
      },
    };

    const company = await Company.findOne({ where: { email: company_email } });
    const sub_admin = await Subadmin.findOne({ where: { email: admin_email } });

    if (!company || !sub_admin) {
      return res.status(401).send({
        meta: {
          message: "Account not registered",
          code: 401,
          status: "failed",
        },
      });
    }
    const payment_types = await PaymentType.findOne({
      where: { name: payment_type },
    });
    let transaction_expire = moment()
      .add(parseInt(payment_types.expiry_duration), "minutes")
      .format("YYYY-MM-DD hh:mm:ss");
    if (payment_types.unit === "hour") {
      transaction_expire = moment()
        .add(parseInt(payment_types.expiry_duration), "hours")
        .format("YYYY-MM-DD hh:mm:ss");
    }
    console.log(transaction_expire);
    console.log(payment_types.expiry_duration);
    console.log(payment_types.unit);
    console.log(transaction_expire);

    coreApi
      .charge(transactionData)
      .then((apiResponse) => {
        Transaction.create({
          company_id: sub_admin.company_id,
          subadmin_id: sub_admin.id,
          subscription_item_id: subscription_id,

          payment_type_id: payment_types.id,

          order_id: apiResponse.order_id,
          personnel_quota: personnel_quota,
          transaction_code: apiResponse.transaction_id,
          transaction_type: "subscription",
          transaction_status: "pending",
          transaction_amount: subscription_item.price * personnel_quota + fee,
          transaction_description: "Subscription",
          transaction_expire: transaction_expire,
          transaction_meta: JSON.stringify(apiResponse),
        })
          .then((data) => {
            PaymentType.hasMany(Transaction, { foreignKey: "payment_type_id" });
            Transaction.belongsTo(PaymentType);
            SubscriptionItem.hasMany(Transaction, {
              foreignKey: "subscription_item_id",
            });
            Transaction.belongsTo(SubscriptionItem);
            Company.hasMany(Transaction, { foreignKey: "company_id" });
            Transaction.belongsTo(Company);

            Transaction.findOne({
              attributes: [
                "subadmin_id",
                "order_id",
                "transaction_type",
                "transaction_status",
                "transaction_amount",
                "transaction_description",
                ["created_at", "transaction_start"],
                [
                  db.fn(
                    "DATE_FORMAT",
                    db.col("transaction_expire"),
                    "%Y-%m-%d %H:%i:%s"
                  ),
                  "transaction_expire",
                ],
                "transaction_meta",
              ],
              include: [
                {
                  model: PaymentType,
                  attributes: ["id", "name", "fee", "unit", "expiry_duration"],
                },
                {
                  model: SubscriptionItem,
                  attributes: ["id", "name", "type", "price"],
                },
                {
                  model: Company,
                  attributes: ["id", "name", "employee_quota"],
                },
              ],
              where: {
                id: data.id,
              },
            }).then((transaction) => {
              res.status(201).send({
                meta: {
                  message: "Transaction successfully",
                  code: 201,
                  status: "success",
                },
                transaction,
              });
            });
          })
          .catch((err) => {
            res.status(err.status).send({
              meta: {
                message: err.message,
                code: err.status,
                status: "error",
              },
            });
          });
      })
      .catch((err) => {
        console.log(err);
        const meta = {
          message: err.ApiResponse.status_message,
          code: parseInt(err.ApiResponse.status_code),
          status: "error",
        };
        res.status(parseInt(err.ApiResponse.status_code)).send(meta);
      });
  } catch (error) {
    const meta = {
      message: error.message,
      code: 422,
      status: "error",
    };
    return res.status(422).json({
      meta,
    });
  }
};

const notificationHandler = async (req, res) => {
  try {
    let receivedJson = req.body;
    coreApi.transaction
      .notification(receivedJson)
      .then(async (transactionStatusObject) => {
        let orderId = transactionStatusObject.order_id;
        let transactionStatus = transactionStatusObject.transaction_status;
        let fraudStatus = transactionStatusObject.fraud_status;

        let summary = `Transaction notification received. Order ID: ${orderId}. Transaction status: ${transactionStatus}. Fraud status: ${fraudStatus}.<br>Raw notification object:<pre>${JSON.stringify(
          transactionStatusObject,
          null,
          2
        )}</pre>`;

        Company.hasMany(Transaction, { foreignKey: "company_id" });
        Transaction.belongsTo(Company);

        const transaction = await Transaction.findOne({
          include: {
            model: Company,
            attributes: ["id", "name", "employee_quota"],
          },
          where: {
            transaction_code: transactionStatusObject.transaction_id,
          },
        });
        console.log(transaction);
        // [5.B] Handle transaction status on your backend via notification alternatively
        // Sample transactionStatus handling logic
        if (transactionStatus == "capture") {
          if (fraudStatus == "challenge") {
            // TODO set transaction status on your databaase to 'challenge'
            Transaction.update(
              {
                transaction_status: "challenge",
              },
              {
                where: {
                  transaction_code: transactionStatusObject.transaction_id,
                },
              }
            );
          } else if (fraudStatus == "accept") {
            // TODO set transaction status on your databaase to 'success'
            Transaction.update(
              {
                transaction_status: "success",
              },
              {
                where: {
                  transaction_code: transactionStatusObject.transaction_id,
                },
              }
            );
          }
        } else if (transactionStatus == "settlement") {
          // TODO set transaction status on your databaase to 'success'
          Transaction.update(
            {
              transaction_status: "success",
            },
            {
              where: {
                transaction_code: transactionStatusObject.transaction_id,
              },
            }
          );
          UserSubscription.create({
            company_id: transaction.company_id,
            subscription_item_id: transaction.subscription_item_id,
            start_at: moment().format("YYYY-MM-DD hh:mm:ss"),
            expires_at: moment().add(1, "months").format("YYYY-MM-DD hh:mm:ss"),
            personnel_quota: transaction.personnel_quota,
          });

          // Note: Non-card transaction will become 'settlement' on payment success
          // Card transaction will also become 'settlement' D+1, which you can ignore
          // because most of the time 'capture' is enough to be considered as success
        } else if (
          transactionStatus == "cancel" ||
          transactionStatus == "deny" ||
          transactionStatus == "expire"
        ) {
          // TODO set transaction status on your databaase to 'failure'
          Transaction.update(
            {
              transaction_status: "failure",
            },
            {
              where: {
                transaction_code: transactionStatusObject.transaction_id,
              },
            }
          );
        } else if (transactionStatus == "pending") {
          // TODO set transaction status on your databaase to 'pending' / waiting payment
          Transaction.update(
            {
              transaction_status: "pending",
            },
            {
              where: {
                transaction_code: transactionStatusObject.transaction_id,
              },
            }
          );
        } else if (transactionStatus == "refund") {
          Transaction.update(
            {
              transaction_status: "refund",
            },
            {
              where: {
                transaction_code: transactionStatusObject.transaction_id,
              },
            }
          );
          // TODO set transaction status on your databaase to 'refund'
        }
        console.log(summary);
        res.send(summary);
      });
  } catch (error) {
    const meta = {
      message: error.message,
      code: error.status,
      status: "error",
    };

    return res.status(error.status).json({
      meta,
    });
  }
};

const statusTransaction = async (req, res) => {
  const { order_id } = req.params;

  try {
    PaymentType.hasMany(Transaction, { foreignKey: "payment_type_id" });
    Transaction.belongsTo(PaymentType);
    SubscriptionItem.hasMany(Transaction, {
      foreignKey: "subscription_item_id",
    });
    Transaction.belongsTo(SubscriptionItem);
    Company.hasMany(Transaction, { foreignKey: "company_id" });
    Transaction.belongsTo(Company);

    const transaction = await Transaction.findOne({
      attributes: [
        "subadmin_id",
        "order_id",
        "transaction_type",
        "transaction_status",
        "transaction_amount",
        "transaction_description",
        ["created_at", "transaction_start"],
        [
          db.fn(
            "DATE_FORMAT",
            db.col("transaction_expire"),
            "%Y-%m-%d %H:%i:%s"
          ),
          "transaction_expire",
        ],
        "transaction_meta",
      ],
      include: [
        {
          model: PaymentType,
          attributes: ["id", "name", "fee", "unit", "expiry_duration"],
        },
        {
          model: SubscriptionItem,
          attributes: ["id", "name", "type", "price"],
        },
        {
          model: Company,
          attributes: ["id", "name", "employee_quota"],
        },
      ],
      where: {
        order_id: order_id,
      },
    });
    if (!transaction) {
      const meta = {
        message: "Data not found",
        code: 404,
        status: "failed",
      };
      return res.status(404).json({
        meta,
      });
    }

    const meta = {
      message: "Status transaction",
      code: 200,
      status: "success",
    };

    let data = {
      transaction,
    };

    res.status(200).json({
      meta,
      data,
    });
  } catch (error) {
    const meta = {
      message: error.message,
      code: 422,
      status: "error",
    };

    return res.status(422).json({
      meta,
    });
  }
};

module.exports = {
  chargeTransaction,
  notificationHandler,
  statusTransaction,
};
