'use strict';

const oracledb = require('oracledb');
const dbConfig = require('./dbconfig.js');
const fs = require("fs");

const sqlite = require('sqlite');

async function run() {

    let oracleConnection;
    let sql, binds, options, result;

    let sqliteConnection;


    try {
        // Get a non-pooled connection
        oracleConnection = await oracledb.getConnection(dbConfig);
        console.log('Connection to Oracle was successful!');


        sqliteConnection = await sqlite.open('./supplemental.sqlite');
        await sqliteConnection.all(`drop TABLE if exists files ;`);
        await sqliteConnection.all(`
            CREATE TABLE if not exists files ( 
            object_id INTEGER PRIMARY KEY, 
            win_file_path TEXT, 
            unix_file_path TEXT,
            file_size INTEGER
         );`);
        console.log('Connection to SQLite was successful!');

        await oracleConnection.execute(`alter session set current_schema = "ORPHEA"`);



        // Query the data

        sql = `
select  
    OBJETS.ID_OBJET ID_OBJET,
    VOLUMES.PC_VOL_NAME || VOLUMES.PC_ROOT || FICHIERS.REP_PC || FICHIERS.NOM_FICHIER as win_file_path,
    VOLUMES.UNIX_VOLUME || VOLUMES.UNIX_ROOT || FICHIERS.REP_UNIX || FICHIERS.NOM_FICHIER as unix_file_path
    
from OBJETS
left outer join FICHIERS on OBJETS.ID_OBJET = FICHIERS.ID_OBJET and FICHIERS.ID_TYPE = 4
left outer join VOLUMES on VOLUMES.ID_VOLUME = FICHIERS.ID_VOLUME
where OBJETS.ID_OBJET between 1 and 100000
`;

        binds = {};

        // For a complete list of options see the documentation.
        options = {
            outFormat: oracledb.OUT_FORMAT_OBJECT ,  // query result format
            // extendedMetaData: true,   // get extra metadata
            fetchArraySize: 100       // internal buffer allocation size for tuning
        };

        result = await oracleConnection.execute(sql, binds, options);


        console.log(result.rows)
        result.rows.map( async function (item) {

            const filePath = require('os').platform() == "win32" ? item.WIN_FILE_PATH : item.UNIX_FILE_PATH
            //const filePath = '/Users/navu/ooreacle/package.json'
            const fileSize = fs.existsSync(filePath) ? fs.statSync(filePath).size : null;
            await sqliteConnection.all(
                `INSERT INTO files (object_id, win_file_path, unix_file_path, file_size) VALUES (${item.ID_OBJET}, '${item.WIN_FILE_PATH}', '${item.UNIX_FILE_PATH}', ${fileSize});`);
        })

        // await sqliteConnection.all(`INSERT INTO files (object_id, path) VALUES (${item.ID_OBJET}, 'Business');`);
        // await sqliteConnection.all(`INSERT INTO files (object_id, path) VALUES (${result.rows[1].ID_OBJET}, 'Business');`);

        console.log("Column metadata: ", result.metaData);
        console.log("Query results: ");
        console.log(result.rows[1].ID_OBJET);

        console.log(result.rows.length);

    } catch (err) {
        console.error(err);
    } finally {
        if (oracleConnection) {
            try {
                await oracleConnection.close();
            } catch (err) {
                console.error(err);
            }
        }
    }
}

run();