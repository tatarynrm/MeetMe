const pool = require("../db/pool");
const reverseGeocode = require("../helpers/reverseGeocode");
const saveLocation = async (ctx) => {
  try {
    const lattitude = ctx.message.location.latitude;
    const longitude = ctx.message.location.longitude;

    // Handle the received location
    const address = await reverseGeocode(lattitude, longitude);
    const userLocation = address.address_components;
    const cityFind = userLocation.filter((item) => {
      return item.types.includes("locality") & item.types.includes("political");
    });
    const streetFind = userLocation.filter((item) => {
      return item.types.includes("route");
    });
    const streetNumberFind = userLocation.filter((item) => {
      return item.types.includes("street_number");
    });
    const city = cityFind[0].long_name;
    const street = streetFind[0].long_name;
    const streetNumber = streetNumberFind[0].long_name;
    const lat = address.geometry.location.lat;
    const long = address.geometry.location.lng;

    console.log(city, street.substring(7), streetNumber);

    const userLoc = await pool.query(
      `select * from users_info where user_id =${ctx.message.from.id}`
    );

    console.log("addressss", address);
    if (userLoc.rows <= 0) {
      const insertQuery =
        "INSERT INTO users_info (city, street, street_number, lat, long) VALUES ($1, $2, $3, $4, $5)";
      const values = [
        city,
        street,
        streetNumber,
        parseFloat(lat),
        parseFloat(long),
      ];

      // Execute the insert query
      pool.query(insertQuery, values, (err, result) => {
        if (err) {
          console.error("Error executing query", err);
        } else {
          console.log("Insert successful:", result.rowCount, "row inserted");
        }
      });
    } else {
      const updateQuery =
        "UPDATE users_info SET city = $1, street = $2, street_number = $3, lat = $4, long = $5 WHERE user_id = $6";
      const values = [
        city,
        street,
        streetNumber,
        parseFloat(lat),
        parseFloat(long),
        ctx.message.from.id,
      ];

      // Execute the update query
      pool.query(updateQuery, values, (err, result) => {
        if (err) {
          console.error("Error executing query", err);
        } else {
          console.log("Update successful:", result.rowCount, "rows updated");
        }
      });
    }
  } catch (error) {
    console.log(error);
  }
};
const saveLocationInTheEnd = async (ctx, lattitude, longitude) => {
  try {
    // Handle the received location
    const address = await reverseGeocode(lattitude, longitude);
    const userLocation = address.address_components;
    const cityFind = userLocation.filter((item) => {
      return item.types.includes("locality") & item.types.includes("political");
    });
    const streetFind = userLocation.filter((item) => {
      return item.types.includes("route");
    });
    const streetNumberFind = userLocation.filter((item) => {
      return item.types.includes("street_number");
    });
    const city = cityFind[0].long_name;
    const street = streetFind[0].long_name;
    const streetNumber = streetNumberFind[0].long_name;
    const lat = address.geometry.location.lat;
    const long = address.geometry.location.lng;

    console.log(city, street.substring(7), streetNumber);

    const userLoc = await pool.query(
      `select * from users_info where user_id =${ctx.message.from.id}`
    );
const onlyStreet = street.substring(7)
    console.log("addressss", address);
    if (userLoc.rows <= 0) {
      const insertQuery =
        "INSERT INTO users_info (city, street, street_number, lat, long) VALUES ($1, $2, $3, $4, $5)";
      const values = [
        city,
        onlyStreet,,
        streetNumber,
        parseFloat(lat),
        parseFloat(long),
      ];

      // Execute the insert query
      pool.query(insertQuery, values, (err, result) => {
        if (err) {
          console.error("Error executing query", err);
        } else {
          console.log("Insert successful:", result.rowCount, "row inserted");
        }
      });
    } else {
      const updateQuery =
        "UPDATE users_info SET city = $1, street = $2, street_number = $3, lat = $4, long = $5 WHERE user_id = $6";
      const values = [
        city,
        onlyStreet,,
        streetNumber,
        parseFloat(lat),
        parseFloat(long),
        ctx.message.from.id,
      ];

      // Execute the update query
      pool.query(updateQuery, values, (err, result) => {
        if (err) {
          console.error("Error executing query", err);
        } else {
          console.log("Update successful:", result.rowCount, "rows updated");
        }
      });
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  saveLocation,
  saveLocationInTheEnd,
};
