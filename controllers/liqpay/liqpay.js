const LiqPay = require("../../my_modules/liqpay/liqpay");
const liqpay = new LiqPay(
  process.env.LIQPAY_PUBLIC_KEY,
  process.env.LIQPAY_PRIVATE_KEY
);
const db = require("../../db/pool");
const { v4: uuidv4 } = require("uuid");
const iconv = require("iconv-lite"); // You may need to install the 'iconv-lite' package via npm

const encodingsToTry = [
  "utf-8",
  "utf-16le",
  "utf-16be",
  "cp1251", // Windows-1251
  "cp866", // IBM866
  "iso-8859-5",
  "koi8-r",
  "koi8-u",
  "iso-8859-1", // Latin-1
  "windows-1252", // Latin-1 (Windows)
];
const stringEncodeFunc = (str) => {
  let decodedString = "";
  for (const encoding of encodingsToTry) {
    try {
      decodedString = iconv.decode(Buffer.from(str, "binary"), encoding);
      break;
    } catch (error) {
      console.log(`Decoding with ${encoding} failed: ${error}`);
    }
  }
  return decodedString;
};
const createCheckout = async (req, res) => {
  const { amount, company_id, name, surname } = req.body;
  try {
    const html = liqpay.cnb_form({
      action: "pay",
      amount: amount,
      currency: "UAH",
      description: "Поповнення особистого кабінету vendmarket.space",
      order_id: uuidv4(),
      version: "3",
      result_url: "https://vendmarket.space/payment-success",
      server_url: "https://api.vendmarket.space/liqpay/callback",
      rro_info: {
        items: [
          {
            amount: 2,
            price: 202,
            cost: 404,
            id: 123456,
          },
        ],
        delivery_emails: ["tatarynrm@gmail.com", "rt@ict.lviv.ua"],
      },
      sender_first_name: name,
      sender_last_name: surname,
      info: "VENDMARKET PAY FOR WATER MACHINE",
      customer: company_id,
    });
    res.json(html);
  } catch (error) {
    console.log(error);
  }
};
const liqpayCallback = async (req, res) => {
  try {
    const data = req.body;

    const jsonData = atob(data.data); // Decode base64
    const jsonSignature = atob(data.signature); // Decode base64
    const orderData = JSON.parse(jsonData);
    const orderId = orderData.order_id;
    const el = orderData;
    console.log(orderData);
const decodedInfo = stringEncodeFunc(el.info)
console.log('decodedInfo',decodedInfo);
  } catch (error) {
    console.log(error);
  }
};
module.exports = {
  liqpayCallback,
};
