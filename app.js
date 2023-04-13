const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
const dbPath = path.join(__dirname, "covid19India.db");
app.use(express.json());

let db = null;

const initializeServerAndDb = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running on http://localhost:3000");
    });
  } catch (e) {
    console.log(`Data base error is ${e.message}`);
    process.exit(1);
  }
};
initializeServerAndDb();

//Returns a list of all states in the state table
// API 1

convertIntoCamelCaseApi1 = (objectItem) => {
  return {
    stateId: objectItem.state_id,
    stateName: objectItem.state_name,
    population: objectItem.population,
  };
};

app.get("/states/", async (request, response) => {
  const getStateListQuery = `SELECT * FROM state`;
  const getStateListResponse = await db.all(getStateListQuery);
  response.send(
    getStateListResponse.map((eachItem) => convertIntoCamelCaseApi1(eachItem))
  );
});

//Returns a state based on the state ID
//API 2

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateIdQuery = `SELECT * FROM state WHERE state_id = ${stateId};`;
  const getStateIdQueryResponse = await db.get(getStateIdQuery);
  response.send(convertIntoCamelCaseApi1(getStateIdQueryResponse));
});

//Create a district in the district table, district_id is auto-incremented
//API 3

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const createDistrictQuery = `INSERT INTO district(district_name, state_id, cases, cured, active, deaths) 
    VALUES('${districtName}', ${stateId}, ${cases}, ${cured}, ${active}, ${deaths});`;
  const createDistrictQueryResponse = await db.run(createDistrictQuery);
  response.send("District Successfully Added");
});

//Returns a district based on the district ID
//API 4

const convertIntoCamelCaseApi4 = (objectItem) => {
  return {
    districtId: objectItem.district_id,
    districtName: objectItem.district_name,
    stateId: objectItem.state_id,
    cases: objectItem.cases,
    cured: objectItem.cured,
    active: objectItem.active,
    deaths: objectItem.deaths,
  };
};

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictIdQuery = `SELECT * FROM district WHERE district_id = ${districtId};`;
  const getDistrictQueryResponse = await db.get(getDistrictIdQuery);
  response.send(convertIntoCamelCaseApi4(getDistrictQueryResponse));
});

//Deletes a district from the district table based on the district ID
//API 5

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const delDistrictIdQuery = `DELETE FROM district WHERE district_id = ${districtId};`;
  await db.run(delDistrictIdQuery);
  response.send("District Removed");
});

//Updates the details of a specific district based on the district ID
//API 6

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateDistDetailsQuery = `UPDATE district SET district_name = '${districtName}', 
  state_id = ${stateId}, cases = ${cases}, cured = ${cured}, active = ${active}, deaths = ${deaths}
  WHERE district_id = ${districtId};`;
  await db.run(updateDistDetailsQuery);
  response.send("District Details Updated");
});

//Returns the statistics of total cases, cured, active, deaths of a specific state based on state ID
//API 7

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const statsQuery = `SELECT SUM(cases) as totalCases, SUM(cured) as totalCured,
  SUM(active) as totalActive, SUM(deaths) as totalDeaths FROM district WHERE state_id = ${stateId}`;
  const getStatsQueryResponse = await db.get(statsQuery);
  response.send(getStatsQueryResponse);
});

//Returns an object containing the state name of a district based on the district ID
//API 8

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictIdQuery = `SELECT state_id FROM district WHERE district_id = ${districtId}`;
  const districtIdQueryResponse = await db.get(getDistrictIdQuery);
  //console.log(typeof getDistrictIdQueryResponse.state_id)

  const stateNameQuery = `SELECT state_name as stateName FROM state WHERE state_id = ${districtIdQueryResponse.stateId}`;
  const getStateNameQueryResponse = await db.get(stateNameQuery);
  response.send(getStateNameQueryResponse);
});

module.exports = app;
