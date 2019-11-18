// for user SYS should add privilege oracledb.SYSDBA equals 2

module.exports = {
    user: "DAM_LOADER",
    password: "ln4K83o&4$c6",
//    connectString:"dmz-db05-n05.dmz.tass.ru:1521/ORPHEAV4"
	connectString:"(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=dmz-db05-n05.dmz.tass.ru)(PORT=1521))(CONNECT_DATA=(SERVER=DEDICATED)(SID=ORPHEAV4)))"
};
