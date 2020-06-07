const express = require('express');
const sqlite3 = require('sqlite3');
const menuItemsRouter = express.Router({mergeParams: true});

const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

menuItemsRouter.param('menuItemId', (req, res, next, menuItemId) => {
    db.get(`SELECT * FROM MenuItem WHERE MenuItem.id = ${menuItemId};`, (err, row) => {
        if (err) {
            next(err);
        } else if (row) {
            req.menuItem = row;
            next();
        } else {
            res.status(404).send(); 
        }
    });
});

menuItemsRouter.get('/', (req, res, next) => {
    const menuId = req.params.menuId;

    db.all(`SELECT * FROM MenuItem WHERE MenuItem.menu_id = ${menuId};`, (err, rows) => {
        if (err) {
            next(err);
        } else {
            res.status(200).json({menuItems: rows});
        }
    });
});

menuItemsRouter.post('/', (req, res, next) => {
    const name = req.body.menuItem.name;
    const description = req.body.menuItem.description;
    const inventory = req.body.menuItem.inventory;
    const price = req.body.menuItem.price;
    const menuId = req.params.menuId;

    if (!name || !description || !inventory || !price) {
        res.status(400).send();
    }

    db.get(`SELECT * FROM Menu WHERE Menu.id = ${menuId};`, (err, row) => {
        if (err) {
            next(err);
        } else if (row === undefined) {
            res.status(404).send();
        }
    });

    const sql = `INSERT INTO MenuItem (name, description, inventory, price, menu_id)
                VALUES ($name, $description, $inventory, $price, $menuId);`;
    const values = {$name: name,
                    $description: description,
                    $inventory: inventory,
                    $price: price,
                    $menuId: menuId};

    // NB: Have to use function(err) here instead of an arrow function because of the way "this" works with arrow functions
    db.run(sql, values, function(err) {
        if (err) {
            next(err);
        } else {
            db.get(`SELECT * FROM MenuItem WHERE MenuItem.id = ${this.lastID};`, (err, row) => {
                if (err) {
                    next(err);
                } else {
                    res.status(201).json({menuItem: row});
                }
            });
        }
    });
});

menuItemsRouter.put('/:menuItemId', (req, res, next) => {
    const name = req.body.menuItem.name;
    const description = req.body.menuItem.description;
    const inventory = req.body.menuItem.inventory;
    const price = req.body.menuItem.price;
    const menuId = req.params.menuId;
    const menuItemId = req.params.menuItemId;

    if (!name || !description || !inventory || !price) {
        res.status(400).send();
    }

    db.get(`SELECT * FROM Menu WHERE Menu.id = ${menuId};`, (err, row) => {
        if (err) {
            next(err);
        } else if (row === undefined) {
            res.status(404).send();
        }
    });

    const sql = `UPDATE MenuItem
                SET name = $name, description = $description, inventory = $inventory, price = $price, menu_id = $menuId
                WHERE id = $menuItemId`;
    const values = {$name: name,
                    $description: description,
                    $inventory: inventory,
                    $price: price,
                    $menuId: menuId,
                    $menuItemId: menuItemId};

    db.run(sql, values, function(err) {
        if (err) {
            next(err);
        } else {
            db.get(`SELECT * FROM MenuItem WHERE MenuItem.id = ${menuItemId};`, (err, row) => {
                if (err) {
                    next(err);
                } else {
                    res.status(200).json({menuItem: row});
                }
            })
        }
    });
});

menuItemsRouter.delete('/:menuItemId', (req, res, next) => {
    const menuId = req.params.menuId;
    const menuItemId = req.params.menuItemId;

    db.get(`SELECT * FROM Menu WHERE Menu.id = ${menuId};`, (err, row) => {
        if (err) {
            next(err);
        } else if (row === undefined) {
            res.status(404).send();
        }
    });

    db.get(`SELECT * FROM MenuItem WHERE MenuItem.id = ${menuItemId};`, (err, row) => {
        if (err) {
            next(err);
        } else if (row === undefined) {
            res.status(404).send();
        }
    });

    db.run(`DELETE FROM MenuItem WHERE MenuItem.id = ${menuItemId};`, err => {
        if (err) {
            next(err);
        } else {
            res.status(204).send();
        }
    });    
});

module.exports = menuItemsRouter;