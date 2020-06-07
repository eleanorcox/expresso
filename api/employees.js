const express = require('express');
const sqlite3 = require('sqlite3');
const employeesRouter = express.Router();
const timesheetsRouter = require('./timesheets');

const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

employeesRouter.param('employeeId', (req, res, next, employeeId) => {
    db.get(`SELECT * FROM Employee WHERE Employee.id = ${employeeId};`, (err, row) => {
        if (err) {
            next(err);
        } else if (row) {
            req.employee = row;
            next();
        } else {
            res.status(404).send(); 
        }
    });
});

employeesRouter.use('/:employeeId/timesheets', timesheetsRouter);

employeesRouter.get('/', (req, res, next) => {
    db.all(`SELECT * FROM Employee WHERE Employee.is_current_employee = 1;`, (err, rows) => {
        if (err) {
            next(err);
        } else {
            res.status(200).json({employees: rows});
        }
    });
});

employeesRouter.get('/:employeeId', (req, res, next) => {
    res.status(200).json({employee: req.employee});
});

employeesRouter.post('/', (req, res, next) => {
    const name = req.body.employee.name;
    const position = req.body.employee.position;
    const wage = req.body.employee.wage;
    const is_current_employee = req.body.employee.is_current_employee === 0 ? 0 : 1; // Defaults to employed

    if (!name || !position || !wage) {
        res.status(400).send();
    }

    const sql = `INSERT INTO Employee (name, position, wage, is_current_employee)
                VALUES ($name, $position, $wage, $is_current_employee);`;
    const values = {$name: name,
                    $position: position,
                    $wage: wage,
                    $is_current_employee: is_current_employee};

    // NB: Have to use function(err) here instead of an arrow function because of the way "this" works with arrow functions
    db.run(sql, values, function(err) {
        if (err) {
            next(err);
        } else {
            db.get(`SELECT * FROM Employee WHERE Employee.id = ${this.lastID};`, (err, row) => {
                if (err) {
                    next(err);
                } else {
                    res.status(201).json({employee: row});
                }
            });
        }
    });
});

employeesRouter.put('/:employeeId', (req, res, next) => {
    const name = req.body.employee.name;
    const position = req.body.employee.position;
    const wage = req.body.employee.wage;
    const is_current_employee = req.body.employee.is_current_employee === 0 ? 0 : 1; // Defaults to employed
    const employeeId = req.params.employeeId;

    if (!name || !position || !wage) {
        res.status(400).send();
    }

    const sql = `UPDATE Employee
                SET name = $name, position = $position, wage = $wage, is_current_employee = $is_current_employee
                WHERE Employee.id = $employeeId`;
    const values = {$name: name,
                    $position: position,
                    $wage: wage,
                    $is_current_employee: is_current_employee,
                    $employeeId: employeeId};

    db.run(sql, values, function(err) {
        if (err) {
            next(err);
        } else {
            db.get(`SELECT * FROM Employee WHERE Employee.id = ${employeeId};`, (err, row) => {
                if (err) {
                    next(err);
                } else {
                    res.status(200).json({employee: row});
                }
            })
        }
    });
});

employeesRouter.delete('/:employeeId', (req, res, next) => {
    const employeeId = req.params.employeeId;

    const sql = `UPDATE Employee
                SET is_current_employee = 0
                WHERE Employee.id = $employeeId;`
    const values = {$employeeId: employeeId};
                    
    db.run(sql, values, function(err) {
        if (err) {
            next(err);
        } else {
            db.get(`SELECT * FROM Employee WHERE Employee.id = ${employeeId};`, (err, row) => {
                res.status(200).json({employee: row});
            });
        }
    });    
});

module.exports = employeesRouter;