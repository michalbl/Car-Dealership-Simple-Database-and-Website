# To seed the database,
# Run the Relational Schema, then run DBSeeder
USE ramblinwrecks;

INSERT INTO LoggedInUsers (Username, Password, FirstName, LastName, UserType)
	VALUES ('username101', 'password', 'Gedd', 'Johnson', 'inventoryclerk');
	
INSERT INTO LoggedInUsers (Username, Password, FirstName, LastName, UserType)
	VALUES ('clerkusername', 'password', 'Gedd', 'Johnson', 'inventoryclerk');
	
INSERT INTO LoggedInUsers (Username, Password, FirstName, LastName, UserType)
	VALUES ('salesusername', 'password', 'John', 'Lennon', 'salesperson');
	
INSERT INTO LoggedInUsers (Username, Password, FirstName, LastName, UserType)
	VALUES ('salesusername2', 'password', 'Paul', 'McCartney', 'salesperson');
	
INSERT INTO LoggedInUsers (Username, Password, FirstName, LastName, UserType)
	VALUES ('managerusername', 'password', 'Michal', 'Bledowski', 'manager');
	
INSERT INTO LoggedInUsers (Username, Password, FirstName, LastName, UserType)
	VALUES ('burdellusername', 'password', 'Mr', 'Burdell', 'burdell');
	
INSERT INTO Customers (CustomerID, FirstName, LastName, Email, Phone, State, Street, City, PostalCode)
	VALUES (1, 'Pete', 'Townshend', 'customeremail@aol.com', '8675309', 'FL', 'The Street', 'Pensacola', '32577');
	
INSERT INTO Customers (CustomerID, FirstName, LastName, Email, Phone, State, Street, City, PostalCode)
	VALUES (2, 'Roger', 'Daltry', 'customeremail2@aol.com', '8505872', 'GA', 'The Road', 'Athens', '09459');

INSERT INTO Customers (CustomerID, FirstName, LastName, Email, Phone, State, Street, City, PostalCode)
	VALUES (1000, 'Greggs', 'Business', 'business1@aol.com', '8505872', 'TN', 'The Circle', 'Gatlinburg', '98765');

INSERT INTO Sellers (CustomerId, SellPrice, SellDate)
	VALUES (1, 5000, '2019-06-20');

INSERT INTO Sellers (CustomerId, SellPrice, SellDate)
	VALUES (1, 3000, '2019-06-20');
	
INSERT INTO Sellers (CustomerId, SellPrice, SellDate)
	VALUES (1, 6000, '2019-06-25');

INSERT INTO Buyers (CustomerId, BuyPrice, PurchaseDate)
	VALUES (1, 12000, '2019-06-25');
	
INSERT INTO Buyers (CustomerId, BuyPrice, PurchaseDate)
	VALUES (2, 13000, '2019-06-25');
	
INSERT INTO Vehicles (VIN, VehicleType, Manufacturer, Model, ModelYear, Mileage, Description, Color, SellerID, BuyerID, Username, VehicleCondition)
	VALUES ('VIN1', 'Sedan', 'Honda', 'Civic', 2009, 60000, 'the description', 'Black', 1, 1, 'salesusername', 'Excellent');
				
INSERT INTO Vehicles (VIN, VehicleType, Manufacturer, Model, ModelYear, Mileage, Description, Color, SellerID, BuyerID, Username, VehicleCondition)
	VALUES ('VIN5', 'Sedan', 'Honda', 'RAV4', 2007, 60000, 'the description', 'Black', 2, NULL, 'clerkusername', 'Good');	
	
INSERT INTO Vehicles (VIN, VehicleType, Manufacturer, Model, ModelYear, Mileage, Description, Color, SellerID, BuyerID, Username, VehicleCondition)
	VALUES ('VIN6', 'Convertible', 'Toyota', 'Camry', 2007, 60000, 'the description', 'Blue', 3, NULL, 'clerkusername', 'Good');	

INSERT INTO Vehicles (VIN, VehicleType, Manufacturer, Model, ModelYear, Mileage, Description, Color, SellerID, BuyerID, Username, VehicleCondition)
	VALUES ('VIN7', 'Convertible', 'Honda', 'Accord', 2008, 60000, 'the description', 'Blue', 3, 2, 'salesusername2', 'Excellent');	
	
INSERT INTO Vendors (VendorName, Phone, State, Street, City, PostalCode)
	VALUES ('RepairMan', '1234567', 'AL', 'The Avenue', 'Mobile', '12344');
	
INSERT INTO Recalls (CampaignNumber, Manufacturer, Description)
	VALUES ('campaign1', 'Honda', 'campaign description');

INSERT INTO Repairs (VIN, RepairStatus, TotalCost, StartDate, EndDate, Description, VendorName, CampaignNumber)
	VALUES ('VIN5', 'Completed', 1000, '2019-06-25', '2019-06-26', 'repair description', 'RepairMan', 'campaign1');

INSERT INTO Repairs (VIN, RepairStatus, TotalCost, StartDate, EndDate, Description, VendorName, CampaignNumber)
	VALUES ('VIN5', 'Completed', 100, '2019-06-29', '2019-06-30', 'repair description', 'RepairMan', 'campaign1');

INSERT INTO Repairs (VIN, RepairStatus, TotalCost, StartDate, EndDate, Description, VendorName, CampaignNumber)
	VALUES ('VIN6', 'pending', 1000, '2019-06-25', '2019-07-7', 'repair description', 'RepairMan', 'campaign1');
	
INSERT INTO Repairs (VIN, RepairStatus, TotalCost, StartDate, EndDate, Description, VendorName, CampaignNumber)
	VALUES ('VIN1', 'pending', 1000, '2019-06-25', '2019-06-26', 'repair description', 'RepairMan', 'campaign1');

INSERT INTO Repairs (VIN, RepairStatus, TotalCost, StartDate, EndDate, Description, VendorName, CampaignNumber)
	VALUES ('VIN1', 'pending', 2000, '2019-06-27', '2019-06-29', 'repair description2', 'RepairMan', 'campaign1');
	
INSERT INTO Business (TIN, CustomerID, Title, BusinessName)
	VALUES ('taxID1', 1000, 'CEO', 'Greggs');
	
INSERT INTO Individual (DLNumber, CustomerID)
	VALUES ('DL123', 2);
	
INSERT INTO Individual (DLNumber, CustomerID)
	VALUES ('DL987', 1);