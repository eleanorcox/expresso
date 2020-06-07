const express = require('express');
const sqlite3 = require('sqlite3');
const menusRouter = express.Router();
const menuItemsRouter = require('./menu-items');

const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

menusRouter.param('menuId', (req, res, next, menuId) => {
    db.get(`SELECT * FROM Menu WHERE Menu.id = ${menuId};`, (err, row) => {
        if (err) {
            next(err);
        } else if (row) {
            req.menu = row;
            next();
        } else {
            res.status(404).send(); 
        }
    });
});

menusRouter.use('/:menuId/menu-items', menuItemsRouter);

menusRouter.get('/', (req, res, next) => {
    db.all(`SELECT * FROM Menu;`, (err, rows) => {
        if (err) {
            next(err);
        } else {
            res.status(200).json({menus: rows});
        }
    });
});

menusRouter.get('/:menuId', (req, res, next) => {
    res.status(200).json({menu: req.menu});
});

menusRouter.post('/', (req, res, next) => {
    const title = req.body.menu.title;
    
    if (!title) {
        res.status(400).send();
    }

    const sql = `INSERT INTO Menu (title)
                VALUES ($title);`;
    const values = {$title: title};

    // NB: Have to use function(err) here instead of an arrow function because of the way "this" works with arrow functions
    db.run(sql, values, function(err) {
        if (err) {
            next(err);
        } else {
            db.get(`SELECT * FROM Menu WHERE Menu.id = ${this.lastID};`, (err, row) => {
                if (err) {
                    next(err);
                } else {
                    res.status(201).json({menu: row});
                }
            });
        }
    });
});

menusRouter.put('/:menuId', (req, res, next) => {
    const menuId = req.params.menuId;
    const title = req.body.menu.title;

    if (!title) {
        res.status(400).send();
    }

    const sql = `UPDATE Menu
                SET title = $title
                WHERE Menu.id = $menuId`;
    const values = {$title: title,
                    $menuId: menuId};

    db.run(sql, values, function(err) {
        if (err) {
            next(err);
        } else {
            db.get(`SELECT * FROM Menu WHERE Menu.id = ${menuId};`, (err, row) => {
                if (err) {
                    next(err);
                } else {
                    res.status(200).json({menu: row});
                }
            })
        }
    });
});

menusRouter.delete('/:menuId', (req, res, next) => {
    const menuId = req.params.menuId;

    db.get(`SELECT * FROM MenuItem WHERE MenuItem.menu_id = ${menuId};`, (err, row) => {
        if (err) {
          next(err);
        } else if (row) {
          res.status(400).send();
        } else {
            db.run(`DELETE FROM Menu WHERE Menu.id = ${menuId}`, err => {
                if (err) {
                    res.status(400).send();
                } else {
                    res.status(204).send();
                }
            });
        }
    });
});

module.exports = menusRouter;