const mongoose = require("mongoose");

exports.connectDatabase = () => {
  mongoose
    .connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then((con) => console.log(`Database connected : ${con.connection.host}`))
    .catch((err) => console.error(err));
};

// export const connectDb = async () => {
//   try {
//     await mongoose.connect(process.env.MONGO_URI, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//       useCreateIndex: true,
//     });
//   } catch (error) {
//     console.log(error.message);
//   }
// };
