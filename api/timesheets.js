const express = require('express');
const sqlite3 = require('sqlite3');
const timesheetsRouter = express.Router({mergeParams: true});

const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

timesheetsRouter.param('timesheetId', (req, res, next, timesheetId) => {
    db.get(`SELECT * FROM Timesheet WHERE Timesheet.id = ${timesheetId};`, (err, row) => {
        if (err) {
            next(err);
        } else if (row) {
            req.timesheet = row;
            next();
        } else {
            res.status(404).send(); 
        }
    });
});

timesheetsRouter.get('/', (req, res, next) => {
    const employeeId = req.params.employeeId;
    db.all(`SELECT * FROM Timesheet WHERE Timesheet.employee_id = ${employeeId};`, (err, rows) => {
        if (err) {
            next(err);
        } else {
            res.status(200).json({timesheets: rows});
        }
    });
});

timesheetsRouter.post('/', (req, res, next) => {
    const hours = req.body.timesheet.hours;
    const rate = req.body.timesheet.rate;
    const date = req.body.timesheet.date;
    const employeeId = req.params.employeeId;

    if (!hours || !rate || !date) {
        res.status(400).send();
    }

    db.get(`SELECT * FROM Employee WHERE Employee.id = ${employeeId};`, (err, row) => {
        if (err) {
            next(err);
        } else if (row === undefined) {
            res.status(404).send();
        }
    });

    const sql = `INSERT INTO Timesheet (hours, rate, date, employee_id)
                VALUES ($hours, $rate, $date, $employeeId);`;
    const values = {$hours: hours,
                    $rate: rate,
                    $date: date,
                    $employeeId: employeeId};

    // NB: Have to use function(err) here instead of an arrow function because of the way "this" works with arrow functions
    db.run(sql, values, function(err) {
        if (err) {
            next(err);
        } else {
            db.get(`SELECT * FROM Timesheet WHERE Timesheet.id = ${this.lastID};`, (err, row) => {
                if (err) {
                    next(err);
                } else {
                    res.status(201).json({timesheet: row});
                }
            });
        }
    });
});

timesheetsRouter.put('/:timesheetId', (req, res, next) => {
    const hours = req.body.timesheet.hours;
    const rate = req.body.timesheet.rate;
    const date = req.body.timesheet.date;
    const employeeId = req.params.employeeId;
    const timesheetId = req.params.timesheetId;

    if (!hours || !rate || !date) {
        res.status(400).send();
    }

    const sql = `UPDATE Timesheet
                SET hours = $hours, rate = $rate, date = $date, employee_id = $employeeId
                WHERE Timesheet.id = $timesheetId`;
    const values = {$hours: hours,
                    $rate: rate,
                    $date: date,
                    $employeeId: employeeId,
                    $timesheetId: timesheetId};

    db.run(sql, values, function(err) {
        if (err) {
            next(err);
        } else {
            db.get(`SELECT * FROM Timesheet WHERE Timesheet.id = ${timesheetId};`, (err, row) => {
                if (err) {
                    next(err);
                } else {
                    res.status(200).json({timesheet: row});
                }
            })
        }
    });
});

timesheetsRouter.delete('/:timesheetId', (req, res, next) => {
    const employeeId = req.params.employeeId;
    const timesheetId = req.params.timesheetId;

    db.get(`SELECT * FROM Employee WHERE Employee.id = ${employeeId};`, (err, row) => {
        if (err) {
            next(err);
        } else if (row === undefined) {
            res.status(404).send();
        }
    });

    db.get(`SELECT * FROM Timesheet WHERE Timesheet.id = ${timesheetId};`, (err, row) => {
        if (err) {
            next(err);
        } else if (row === undefined) {
            res.status(404).send();
        }
    });

    const sql = `DELETE FROM Timesheet
                WHERE Timesheet.id = $timesheetId;`
    const values = {$timesheetId: timesheetId};
                    
    db.run(sql, values, err => {
        if (err) {
            next(err);
        } else {
            res.status(204).send();
        }
    });    
});

module.exports = timesheetsRouter;