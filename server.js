const express = require('express');
const session = require('express-session');
const server = express();
const path = require('path');
const db = require('./db.js');
const port = process.env.PORT || 8080;
server.use(express.json());
server.use(express.urlencoded());
server.use(express.static(path.join(__dirname)));
server.set('view engine', 'ejs')

// session
server.use(session({secret: 'secret'}));

server.listen(port, () => {
    console.log(`server listening on port: ${port}`);
});

server.get('/api/clearuser', (req, res) => {
    const sess = req.session;
    delete sess.username;
    delete sess.usertype;
    sess.save()
});

server.post('/login', (req, res) => {
    db.query(`SELECT Username, UserType FROM LoggedInUsers 
                WHERE Username='${req.body.username}' AND Password='${req.body.password}'`, 
            (err, rows) => {
                if (err) throw err;

                // handle if username/pw combo is not in DB
                if (rows.length == 0) {
                    return res.end('Wrong credentials!')
                }
                const sess = req.session;
                sess.username = rows[0].Username;
                sess.usertype = rows[0].UserType;

                if (sess.usertype === 'inventoryclerk' ||
                    sess.usertype === 'salesperson' || 
                    sess.usertype ==='manager' ||
                    sess.usertype === 'burdell') {
                        res.render('PrivilegedSearchView', {
                            usertype: sess.usertype
                        })
                }
            });
});



// In-stock vehicle count
server.get('/api/vehiclecount', (req, res) => {
    db.query(
        `SELECT COUNT(*) AS countveh FROM 
        (SELECT DISTINCT Vehicles.VIN, VehicleType, ModelYear, Manufacturer, Model, Color, Mileage, 
                  case when z.TotalCost is null then ROUND(SellPrice * 1.25,2) else ROUND(SellPrice * 1.25 + z.TotalCost*1.1,2) end as SalesPrice
                  FROM Vehicles 
                  INNER JOIN Sellers ON Sellers.SellerID = Vehicles.SellerID
                  LEFT JOIN 
                        (SELECT vin, SUM(totalcost) as TotalCost FROM Repairs GROUP BY 1) AS z ON z.VIN = Vehicles.VIN
                  LEFT JOIN Repairs ON Repairs.VIN = Vehicles.VIN
                  WHERE BuyerID is null AND (RepairStatus = 'completed' OR ISNULL(RepairStatus))
                  ORDER BY Vehicles.VIN ASC 
        ) AS bb`, 
        (err, rows) => {
            if (err) throw err;

            res.send(JSON.stringify(rows[0]['countveh']));
    })
});


// Vehicle search by parameters
server.get('/api/vehiclesearch', (req, res) => {
    const sess = req.session
        db.query(
            `
            SELECT * FROM (
                SELECT DISTINCT Vehicles.VIN, VehicleType, ModelYear, Manufacturer, Model, Color, Mileage, SellPrice, Vehicles.Description AS Description,
                case when z.TotalCost is null then ROUND(SellPrice * 1.25,2) else ROUND(SellPrice * 1.25 + z.TotalCost*1.1,2) end AS SalesPrice
                FROM Vehicles 
                INNER JOIN Sellers ON Sellers.SellerID = Vehicles.SellerID
                LEFT JOIN Repairs ON Repairs.VIN = Vehicles.VIN
                LEFT JOIN (SELECT VIN, SUM(totalcost) as TotalCost FROM Repairs GROUP BY 1) AS z ON z.VIN = Vehicles.VIN
                WHERE BuyerID is null AND (RepairStatus = 'completed' OR ISNULL(RepairStatus))
            ) AS instock
            WHERE VehicleType LIKE '%${req.query.vehicleType}%'  AND Manufacturer LIKE '%${req.query.manufacturer}%'
              AND ModelYear   LIKE '%${req.query.modelYear}%'    AND Color LIKE '%${req.query.color}%'
            `, 
        (err, rows) => {
            if (err) throw err;
            console.log("rows", rows)
            res.render('SearchResults', {
                vehicles: rows
            })
        })
});

// Vehical search by keyword
server.get('/api/vehiclesearchkeyword', (req, res) => {
    const sess = req.session
        db.query(
            `
            SELECT * FROM (
                SELECT DISTINCT Vehicles.VIN, VehicleType, ModelYear, Manufacturer, Model, Color, Mileage, SellPrice, Vehicles.Description AS Description,
                case when z.TotalCost is null then ROUND(SellPrice * 1.25,2) else ROUND(SellPrice * 1.25 + z.TotalCost*1.1,2) end AS SalesPrice
                FROM Vehicles 
                INNER JOIN Sellers ON Sellers.SellerID = Vehicles.SellerID
                LEFT JOIN Repairs ON Repairs.VIN = Vehicles.VIN
                LEFT JOIN (SELECT VIN, SUM(totalcost) as TotalCost FROM Repairs GROUP BY 1) AS z ON z.VIN = Vehicles.VIN
                WHERE BuyerID is null AND (RepairStatus = 'completed' OR ISNULL(RepairStatus))
           ) AS instock
            WHERE Description LIKE '%${req.query.keyword}%' 
            OR ModelYear LIKE '%${req.query.keyword}%' 
            OR Manufacturer LIKE '%${req.query.keyword}%'
            OR Color LIKE '%${req.query.keyword}%'
            OR VehicleType LIKE '%${req.query.keyword}%'
            `, 
        (err, rows) => {
            if (err) throw err;
            console.log("rows", rows)
            res.render('SearchResults', {
                vehicles: rows
            })
        })
});



// Vehicle details
server.get('/api/vehicledetails', (req, res) => {
    const sess = req.session;;
    const vin = req.query.vin;
    sess.vin = vin;
    let vehicle, repairs;
    db.query(
        `
        SELECT Vehicles.VIN, VehicleType, Manufacturer, Model, ModelYear, Mileage, Vehicles.Description as VehicleDescription,
        Color, VehicleCondition, SellPrice, 
        case when z.TotalCost is null then ROUND(SellPrice * 1.25,2) else ROUND(SellPrice * 1.25 + z.TotalCost*1.1,2) end as SalesPrice
            FROM Vehicles
            INNER JOIN Sellers ON Sellers.SellerID = Vehicles.SellerID
            LEFT JOIN 
			(SELECT VIN, SUM(totalcost) as TotalCost FROM Repairs GROUP BY 1) z ON z.VIN = Vehicles.VIN
            LEFT JOIN Repairs ON Vehicles.VIN = '${vin}' AND Repairs.VIN = '${vin}'
            LEFT JOIN Vendors ON Vendors.VendorName = Repairs.VendorName
            WHERE Vehicles.VIN = '${vin}'
            `, 
        (err, rows) => {
            if (err) throw err;

            vehicle = rows[0]

            db.query(
                `
                SELECT VendorName, DATE_FORMAT(StartDate,'%Y-%m-%d') as StartDate, DATE_FORMAT(EndDate,'%Y-%m-%d') as EndDate, 
		            RepairStatus, Repairs.Description as RepairDescription, Repairs.CampaignNumber, Recalls.Description as RecallDescription, TotalCost
                    FROM Repairs 
                    LEFT JOIN Recalls ON Repairs.CampaignNumber = Recalls.CampaignNumber
                    WHERE VIN = '${vin}'
                `, 
            (err, rows) => {
                if (err) throw err;

                repairs = rows

                let totalrepaircost = 0;
                for (let i=0; i < rows.length; i++) {
                    totalrepaircost += rows[i].TotalCost
                }

                res.render('VehicleDetails', {
                    vehicle,
                    repairs,
                    totalrepaircost,
                    usertype: sess.usertype || 'public'
                })
            });
        });
});



server.get('/api/vehiclepending', (req, res) => {
    db.query(
        `SELECT COUNT(DISTINCT Vehicles.VIN)
		FROM Vehicles
        LEFT JOIN Repairs ON Repairs.VIN = Vehicles.VIN
        WHERE RepairStatus = 'pending';`, 
        (err, rows) => {
            if (err) throw err;

            res.send(JSON.stringify(rows[0]['COUNT(DISTINCT Vehicles.VIN)']));
    })
});


server.get('/api/vinsearch', (req, res) => {
    db.query(
        `
        SELECT Vehicles.VIN, VehicleType, ModelYear, Manufacturer, Model, Color, Mileage, 
		case when z.TotalCost is null then ROUND(SellPrice * 1.25,2) else ROUND(SellPrice * 1.25 + z.TotalCost*1.1,2) end as SalesPrice
        FROM Vehicles 
		LEFT JOIN 
		(select vin, sum(totalcost) as TotalCost from Repairs group by 1) z ON z.VIN = Vehicles.VIN
        INNER JOIN Sellers ON Sellers.SellerID = Vehicles.SellerID
        WHERE Vehicles.VIN = '${req.query.vin}' AND ISNULL(Vehicles.BuyerID)
        `,
        (err, rows) => {
            if (err) throw err;

            console.log("rows", rows)
            res.render('SearchResults', {
                vehicles: rows
            })        
        }
    )
});


server.get('/api/repaircount', (req, res) => {
    db.query(
        `SELECT COUNT(DISTINCT Vehicles.VIN)
		FROM Vehicles
        LEFT JOIN Repairs ON Repairs.VIN = Vehicles.VIN
        WHERE (RepairStatus = 'pending' OR RepairStatus = 'in progress') AND BuyerID IS NULL`, 
        (err, rows) => {
            if (err) throw err;

            res.send(JSON.stringify(rows[0]['COUNT(DISTINCT Vehicles.VIN)']));
    });
});


server.post('/api/addrepair', (req, res) => {
    const sess = req.session;
    const {vin, cost, startdate, enddate, description, campaign, vendorname} = req.body;
    sess.vin = vin;
    let campaingSqlArg = null;

    // need to do this because campaign is nullable
    if (campaign) {
        campaingSqlArg = `'${campaign}'`
    }

    db.query(
        `
        INSERT INTO Repairs (VIN, RepairStatus, TotalCost, StartDate, EndDate, Description, VendorName, CampaignNumber)
        VALUES ('${vin}', 'pending', ${cost}, '${startdate}', '${enddate}', '${description}', '${vendorname}', ${campaingSqlArg});   
        `, 
    (rows, err) => {
        console.log('successfully added repair!');
        res.redirect(`/api/vehicledetails?vin=${vin}`)
    });
});


server.get('/api/searchvendor', (req, res) => {
    const sess = req.session;
    db.query(
        `SELECT VendorName FROM Vendors WHERE VendorName='${req.query.vendorname}'`, 
    (err, rows) => {
        if (err) throw err;
  
        if (sess.usertype == 'inventoryclerk') {
            if (rows.length === 1) {
                res.render('AddRepairForm', {
                    vin: sess.vin,
                    vendorname: req.query.vendorname
                })
            } else if (rows.length === 0) {
                res.render('AddVendorForm')
            } else {
                throw "search returned more than 1 result...that's bad..."
            }
        }
    })
});

server.post('/api/addvendor', (req, res) => {
    const sess = req.session;
    const {vendorname, phone, state, street, city, zip} = req.body;
    db.query(`
    INSERT INTO Vendors (VendorName, Phone, State, Street, City, PostalCode)
	    VALUES ('${vendorname}', '${phone}', '${state}', '${street}', '${city}', '${zip}');
    `, 
    (err, rows) => {
        if (err) throw err;
        res.render('AddRepairForm', {
            vendorname: vendorname,
            vin: sess.vin
        })
    });
});

server.get('/api/searchmanager', (req, res) => {
    db.query(
        `SELECT Vehicles.VIN, VehicleType, ModelYear, Manufacturer, Model, Color, Mileage, 
		case when z.TotalCost is null then ROUND(SellPrice * 1.25,2) else ROUND(SellPrice * 1.25 + z.TotalCost*1.1,2) end as SalesPrice, Repairs.RepairStatus
        FROM Vehicles 
		 LEFT JOIN 
		(select vin, sum(totalcost) as TotalCost from Repairs group by 1) z ON z.VIN = Vehicles.VIN
        INNER JOIN Sellers ON Sellers.SellerID = Vehicles.SellerID
        INNER JOIN Repairs ON Repairs.VIN = Vehicles.VIN
        WHERE (VehicleType = '${req.query.vehicleType}' AND Manufacturer = '${req.query.manufacturer}' AND ModelYear = ${req.query.modelYear || 0}
            AND Color = '${req.query.color}') OR (Manufacturer LIKE '${req.query.keyword}' OR ModelYear LIKE '${req.query.keyword}'
            OR Model LIKE '${req.query.keyword}' OR Vehicles.Description LIKE '${req.query.keyword}')
			OR Vehicles.VIN='${req.query.vin}'
        ORDER BY Vehicles.VIN ASC`, 
    (err, rows) => {
        if (err) throw err;
        console.log("rows", rows)
        res.render('ManagerSearchResults', {
            vehicles: rows
        })
    })
});

server.get('/api/searchcustomer', (req, res) => {
    db.query(
        `SELECT Customers.CustomerID, TIN, DLNumber, BusinessName, FirstName, LastName FROM Customers
            LEFT JOIN Business ON Business.CustomerID = Customers.CustomerID
            LEFT JOIN Individual ON Individual.CustomerID = Customers.CustomerID
            WHERE DLNumber = '${req.query.customerid}' OR TIN ='${req.query.customerid}'`, 
    (err, rows) => {
        if (err) throw err;

        const sess = req.session;
  
        if (sess.usertype == 'inventoryclerk') {
            if (rows.length === 1) {
                if (rows[0].TIN != null) {
                    sess.tin = rows[0].TIN
                } else if (rows[0].DLNumber != null) {
                    sess.dlnumber = rows[0].DLNumber
                }  
                res.render('AddVehicleForm', {
                    customer: {
                        type: rows[0].TIN || rows[0].DLNumber,
                        first: rows[0].FirstName || rows[0].BusinessName,
                        last: rows[0].LastName
                    }
                })
            } else if (rows.length === 0) {
                res.render('AddCustomerForm')
            } else {
                throw "search returned more than 1 result...that's bad..."
            }
        }
    })
});

server.post('/api/addvehicle', (req, res) => {
    const sess = req.session;
    const {vin, vehicletype, manufacturer, model, year, mileage, description, color, condition, price} = req.body
    const {username} = sess;
    sess.vin = vin;

    if (sess.tin) {
        db.query(
            `
            INSERT INTO Sellers (CustomerID, SellPrice, SellDate)
            VALUES ((SELECT CustomerID FROM Business WHERE TIN='${sess.tin}'), ${price}, CURDATE());
            
            INSERT INTO Vehicles (VIN, VehicleType, Manufacturer, Model, ModelYear, Mileage, Description, Color, VehicleCondition, SellerID, BuyerID, Username)
            VALUES ('${vin}', '${vehicletype}', '${manufacturer}', '${model}', ${year}, ${mileage}, '${description}', '${color}', '${condition}', 
            (SELECT SellerID FROM Sellers WHERE SellerID=LAST_INSERT_ID()), NULL, '${username}')
            `,
            (err, rows) => {
                if (err) throw err;

                delete sess.tin
                sess.save()
                console.log('successfully added vehicle for business customer!');
                res.render('VehicleDetails', {
                    usertype: sess.usertype,
                    repairs: null,
                    vehicle: {
                        VIN: vin,
                        VehicleType: vehicletype,
                        ModelYear: year,
                        Manufacturer: manufacturer,
                        Color: color,
                        Model: model,
                        Mileage: mileage,
                        SalesPrice: price * 1.25,
                        SellPrice: price,
                        VehicleDescription: description
                    }
                })
            }
        )
    } else if (sess.dlnumber) {
        db.query(
            `
            INSERT INTO Sellers (CustomerID, SellPrice, SellDate)
            VALUES ((SELECT CustomerID FROM Individual WHERE DLNumber = '${sess.dlnumber}' ), ${price}, CURDATE());

            INSERT INTO Vehicles (VIN, VehicleType, Manufacturer, Model, ModelYear, Mileage, Description, Color, VehicleCondition, SellerID, BuyerID, Username)
            VALUES ('${vin}', '${vehicletype}', '${manufacturer}', '${model}', ${year}, ${mileage}, '${description}', '${color}', '${condition}', 
            (SELECT SellerID FROM Sellers WHERE SellerID=LAST_INSERT_ID()), NULL, '${username}')
            `,
            (err, rows) => {
                if (err) throw err;

                delete sess.dlnumber
                sess.save()
                console.log('successfully added vehicle for individual customer');
                res.render('VehicleDetails', {
                    usertype: sess.usertype,
                    repairs: null,
                    vehicle: {
                        VIN: vin,
                        VehicleType: vehicletype,
                        ModelYear: year,
                        Manufacturer: manufacturer,
                        Color: color,
                        Model: model,
                        Mileage: mileage,
                        SalesPrice: price * 1.25,
                        SellPrice: price,
                        VehicleDescription: description
                    }
                })            
            }
        )
    }
});

server.post('/api/updaterepairstatus', (req, res) => {    
    db.query(`UPDATE Repairs SET RepairStatus='${req.body.repairstatus}' WHERE VIN='${req.body.vin}' AND StartDate = '${req.body.repairstart}'; `,
     (err, rows) => {
        if (err) throw err;
        res.send('success')
        console.log('successfully updated repair')
    })
});

server.post('/api/addbusiness', (req, res) => {
    const {taxid, email, phone, state, street, city, postal, first, last, title, business} = req.body
    db.query(
        `INSERT INTO Business (TIN, Title, BusinessName)
            VALUES ('${taxid}', '${title}', '${business}');
            INSERT INTO Customers (CustomerID, Email, Phone, State, Street, City, PostalCode, FirstName, LastName)
            VALUES (LAST_INSERT_ID(), '${email}', '${phone}', '${state}', '${street}', '${city}', '${postal}', '${first}', '${last}');
        `, 
    (err, rows) => {
        if (err) throw err;
        
        const sess = req.session;
        sess.tin = taxid
        if (sess.usertype === 'inventoryclerk') {
            res.render('AddVehicleForm', {
                customer: {
                    type: taxid,
                    first: business
                }
            })
        }
    })
});


server.post('/api/addindividual', (req, res) => {
    const {dlid, email, phone, state, street, city, postal, first, last} = req.body
    db.query(
        `INSERT INTO Individual (DLNumber)
            VALUES ('${dlid}');
            INSERT INTO Customers (CustomerID, Email, Phone, State, Street, City, PostalCode, FirstName, LastName)
            VALUES (LAST_INSERT_ID(), '${email}', '${phone}', '${state}', '${street}', '${city}', '${postal}', '${first}', '${last}');
        `, 
    (err, rows) => {
        if (err) throw err;
        
        const sess = req.session;
        sess.dlnumber = dlid
        if (sess.usertype === 'inventoryclerk') {
            res.render('AddVehicleForm', {
                customer: {
                    type: dlid,
                    first: first,
                    last: last
                }
            })
        }
    })
});

server.get('/api/vehiclesalecustomerlookup', (req, res) => {
    const sess = req.session;;
    const vin = req.query.vin;
    const salesprice = req.query.salesprice;
	 res.render('SearchCustomerSale', {
		vin: req.query.vin,
		salesprice: req.query.salesprice,
		usertype: sess.usertype || 'salesperson'
	})
});

server.get('/api/customersearch1', (req, res) => {
    const sess = req.session;;
    const vin = req.query.vin;
    const salesprice = req.query.salesprice;
	    db.query(
        `SELECT Customers.CustomerID, TIN, DLNumber, BusinessName, FirstName, LastName FROM Customers
            LEFT JOIN Business ON Business.CustomerID = Customers.CustomerID
            LEFT JOIN Individual ON Individual.CustomerID = Customers.CustomerID
            WHERE DLNumber = '${req.query.customerid}' OR TIN ='${req.query.customerid}'`, 
        (err, rows) => {
        if (err) throw err;
		console.log("rows", rows)
		console.log("rows", rows.length)
		if (rows.length == 0) {
		res.render('AddCustomerForm', {
		usertype: sess.usertype || 'salesperson'
		})
		} else {
		res.render('SalesOrderForm', {
			customernum: JSON.stringify(rows[0]['CustomerID']),
			vin: vin,
			salesprice: salesprice,
		usertype: sess.usertype || 'salesperson'
		
		})}
		})
});

server.get('/api/vehiclesale', (req, res) => {
    const sess = req.session;;
    const vin = req.query.vin;
    const salesprice = req.query.salesprice;
    const customernum = req.query.customernum;
    const date = req.query.date;
	db.query(
        `INSERT INTO buyers (CustomerID, BuyPrice, PurchaseDate)
            VALUES ('${customernum}', '${salesprice}', '${date}');
			UPDATE vehicles 
			set BuyerID=LAST_INSERT_ID()
			where vin='${vin}';
		`, 
       (err, rows) => {
		if (err) throw err;
		res.render('PrivilegedSearchView', {
		usertype: sess.usertype || 'salesperson'
	})
})
});




// REPORTS QUERIES
server.get('/reports/seller-history', (req, res) => {
    db.query(
        `SELECT Customers.CustomerID, IFNULL(LastName,'---') AS LastName, IFNULL(FirstName,'---') AS FirstName, IFNULL(BusinessName, '---') AS BusinessName, ROUND(AVG(SellPrice),0) AS AvePurchPrice,
        COUNT(DISTINCT Sellers.SellerID) AS NoOfVehiclesSold, AveRepairsperVehicle
        FROM Customers
        LEFT JOIN Individual ON Individual.CustomerID=Customers.CustomerID
        LEFT JOIN Business ON Business.CustomerID=Customers.CustomerID
        LEFT JOIN Sellers ON Sellers.CustomerID=Customers.CustomerID
        LEFT JOIN Vehicles ON Vehicles.SellerID=Sellers.SellerID
        LEFT JOIN
        (
        SELECT CustomerID, ROUND(COUNT(Repairs.RepairStatus)/COUNT(DISTINCT Repairs.VIN),1) AS AveRepairsperVehicle
        FROM Repairs
        LEFT JOIN Vehicles ON Vehicles.VIN=Repairs.VIN
        LEFT JOIN Sellers ON Sellers.SellerID=Vehicles.SellerID
        Group BY CustomerID
        )
        AS AveRepair ON AveRepair.CustomerID=Customers.CustomerID
        Group BY Customers.CustomerID 
        ORDER BY NoOfVehiclesSold DESC, AvePurchPrice DESC;`, 
    (err, rows) => {
        if (err) throw err;
        console.log("rows", rows)
        res.render('ReportSellerHistory', {
            vehicles: rows
        })
    })
});

server.get('/reports/invenotry-age', (req, res) => {
    db.query(
        `SELECT
        VehicleType,
        MAX(DATEDIFF(CURDATE(), SellDate)) AS MaxAge,
        ROUND(AVG(DATEDIFF(CURDATE(), SellDate))) AS AvgAge,
        MIN(DATEDIFF(CURDATE(), SellDate)) AS MinAge
        FROM Sellers
        JOIN Vehicles ON Sellers.SellerID=Vehicles.SellerID
        WHERE Vehicles.BuyerID IS NULL
        GROUP BY Vehicles.VehicleType;`, 
    (err, rows) => {
        if (err) throw err;
        console.log("rows", rows)
        res.render('ReportInventoryAge', {
            vehicles: rows
        })
    })
});

server.get('/reports/ave-time-in-invetory', (req, res) => {
    db.query(
        `SELECT
        VehicleType,
        ROUND(AVG(DATEDIFF(PurchaseDate, SellDate)),1) AS AVG_Time_In_Inv
        FROM Buyers
        JOIN Vehicles ON Buyers.BuyerID=Vehicles.BuyerID
        JOIN Sellers ON Vehicles.SellerID=Sellers.SellerID
        GROUP BY Vehicles.VehicleType;`, 
    (err, rows) => {
        if (err) throw err;
        console.log("rows", rows)
        res.render('ReportAveTimeInInventory', {
            vehicles: rows
        })
    })
});


server.get('/reports/price-per-condition', (req, res) => {
    db.query(
        `SELECT 
        VehicleType, 
        VehicleCondition,
        ROUND(AVG(SellPrice),0) AS AveSellPrice
        FROM Sellers
        LEFT JOIN Vehicles ON Sellers.SellerID=Vehicles.SellerID
        GROUP BY Vehicles.VehicleType, Vehicles.VehicleCondition`, 
    (err, rows) => {
        if (err) throw err;
        console.log("rows", rows)
        res.render('ReportPricePerCondition', {
            vehicles: rows
        })
    })
});

server.get('/reports/repair-stat', (req, res) => {
    db.query(
        `SELECT
        Vendors.VendorName AS VendorName,
        ROUND(SUM(TotalCost),2) AS TotalCost,
        COUNT(RepairStatus) AS NoOfRepairs,
        ROUND(AVG(DATEDIFF(EndDate, StartDate)),1) AS AveTime,
        ROUND(COUNT(Repairs.RepairStatus)/COUNT(DISTINCT Repairs.VIN),1) AS AvgRepairsperVehicle
        FROM Repairs
        JOIN Vendors ON Repairs.VendorName=Vendors.VendorName
        WHERE Repairs.RepairStatus="completed"
        GROUP BY Vendors.VendorName;`, 
    (err, rows) => {
        if (err) throw err;
        console.log("rows", rows)
        res.render('ReportRepairStatistics', {
            vehicles: rows
        })
    })
});


server.get('/reports/monthlysales1', (req, res) => {
    db.query(
        `SELECT
        CONCAT(CONVERT(YEAR(PurchaseDate), varchar(4)),'-', CONVERT(MONTH(PurchaseDate), varchar(2))) AS date,
        COUNT(DISTINCT(Vehicles.VIN)) AS NoOfVehSold,
        FORMAT(ROUND(SUM(1.25*SellPrice)),0) AS TotalIncome,
        FORMAT(ROUND(SUM(1.25*SellPrice-SellPrice-Repairs.TotalCost)),0) AS Income
        FROM Buyers
        LEFT JOIN Vehicles ON Buyers.BuyerID=Vehicles.BuyerID
        LEFT JOIN Sellers ON Vehicles.SellerID=Sellers.SellerID
        LEFT JOIN Repairs ON Vehicles.VIN=Repairs.VIN
        GROUP BY YEAR(PurchaseDate)+ MONTH(PurchaseDate) desc;`, 
    (err, rows) => {
        if (err) throw err;
        console.log("rows", rows)
        res.render('ReportMonthlySales1', {
            vehicles: rows
        })
    })
});

server.get('/reports/monthlysales2', (req, res) => {
    db.query(
        `SELECT FirstName, LastName,
        ROUND(COUNT(1.25*SellPrice)) AS NoOfVehSold,
        FORMAT(ROUND(SUM(1.25*SellPrice)),0) as TotalSales
        FROM LoggedInUsers
        INNER JOIN Vehicles ON Vehicles.Username = LoggedInUsers.Username
        JOIN Sellers ON Sellers.SellerID = Vehicles.SellerId
        WHERE UserType = 'salesperson'
        GROUP BY LoggedInUsers.Username
        ORDER BY NoOfVehSold desc, TotalSales desc;`, 
    (err, rows) => {
        if (err) throw err;
        console.log("rows", rows)
        res.render('ReportMonthlySales2', {
            vehicles: rows
        })
    })
});
