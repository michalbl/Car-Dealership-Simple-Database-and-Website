
/* server.get('/api/vehiclesearch', (req, res) => {
    const sess = req.session

    if (sess.usertype != 'salesperson') {
        db.query(
            `SELECT DISTINCT Vehicles.VIN, VehicleType, ModelYear, Manufacturer, Model, Color, Mileage, 
			case when z.TotalCost is null then ROUND(SellPrice * 1.25,2) else ROUND(SellPrice * 1.25 + z.TotalCost*1.1,2) end as SalesPrice
            FROM Vehicles 
            INNER JOIN Sellers ON Sellers.SellerID = Vehicles.SellerID
            LEFT JOIN 
			(select vin, sum(totalcost) as TotalCost from Repairs group by 1) z ON z.VIN = Vehicles.VIN
            WHERE (VehicleType = '${req.query.vehicleType}' AND Manufacturer = '${req.query.manufacturer}' AND ModelYear = ${req.query.modelYear || 0}
                AND Color = '${req.query.color}') OR
                (Manufacturer LIKE '%${req.query.keyword}%' OR ModelYear LIKE '%${req.query.keyword}%'
                OR Model LIKE '%${req.query.keyword}%' OR Vehicles.Description LIKE '%${req.query.keyword}%')
                AND ISNULL(BuyerID)
            ORDER BY Vehicles.VIN ASC`, 
        (err, rows) => {
            if (err) throw err;
            console.log("rows", rows)
            res.render('SearchResults', {
                vehicles: rows
            })
        })
	} else {
        db.query(
            `
            SELECT DISTINCT Vehicles.VIN, VehicleType, ModelYear, Manufacturer, Model, Color, Mileage, 
			case when z.TotalCost is null then ROUND(SellPrice * 1.25,2) else ROUND(SellPrice * 1.25 + z.TotalCost*1.1,2) end as SalesPrice
            FROM Vehicles 
            INNER JOIN Sellers ON Sellers.SellerID = Vehicles.SellerID
            LEFT JOIN 
			(select vin, sum(totalcost) as TotalCost from Repairs group by 1) z ON z.VIN = Vehicles.VIN
			LEFT JOIN Repairs ON Repairs.VIN = Vehicles.VIN
            WHERE (VehicleType = '${req.query.vehicleType}' AND Manufacturer = '${req.query.manufacturer}' AND ModelYear = ${req.query.modelYear || 0}
                AND Color = '${req.query.color}') OR
                (Manufacturer LIKE '%${req.query.keyword}%' OR ModelYear LIKE '%${req.query.keyword}%'
                OR Model LIKE '%${req.query.keyword}%' OR Vehicles.Description LIKE '%${req.query.keyword}%')
                AND ISNULL(BuyerID) AND (RepairStatus = 'completed' OR ISNULL(RepairStatus))
            ORDER BY Vehicles.VIN ASC
            `, 
        (err, rows) => {
            if (err) throw err;
            console.log("rows", rows)
            res.render('SearchResults', {
                vehicles: rows
            })
        })
    }
}); */
