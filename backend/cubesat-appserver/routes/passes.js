﻿const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const parseUrlencoded = bodyParser.urlencoded({extended: false});
const parseJSON = bodyParser.json();
var db = require('../database');

router.route('/')
    .get(parseUrlencoded, parseJSON, (req, res) => {
        try {
            db.query("SELECT * FROM passes;", function (error, results, fields) {
                if (error) throw error;

                res.send(results);
              });
        } catch (err) {
            console.log(err);
            res.send(err);
        }
    })
    .post(parseUrlencoded, parseJSON, (req, res) => {
        try {
            var insertParameters = [req.body.passHasOccurred, req.body.estimatedPassDateTime];

            // using this pattern of using ? in our query builder does the escaping for us! No need to worry about sql injection
            db.query('INSERT INTO passes (passHasOccurred, estimatedPassDateTime) VALUES (?, ?)', insertParameters, function (error, results, fields) {
                if (error) throw error;

                res.json(results);
              });
        } catch (err) {
            console.log(err);
            res.send(err);
        }
    });

router.route('/:id')
    .put(parseUrlencoded, parseJSON, (req, res) => {
        try {

            var passToUpdate = req.params.id;
            var updateParameters = [req.body.passHasOccurred, req.body.estimatedPassDateTime, passToUpdate];

            db.query('UPDATE passes SET passHasOccurred = ?, estimatedPassDateTime = ? WHERE telecommandID = ?', updateParameters, function (error, results, fields) {
                if (error) throw error;

                res.json(results);
              });
        } catch (err) {
            console.log(err);
            res.send(err);
        }
    });

router.route('/transmission-sum')
    .get(parseUrlencoded, parseJSON, (req, res) => {
        try {
            db.query('SELECT pass.passID, SUM(bandwidthUsage), SUM(powerConsumption)' + 
                'FROM cubesat.passes as pass' +
                'RIGHT JOIN cubesat.queuedTelecommands as qtc' +
                'ON pass.passID = qtc.transmissionPassID' +
                'LEFT JOIN cubesat.telecommands as tc' + 
                'ON qtc.telecommandID = tc.telecommandID' + 
                'GROUP BY pass.passID;', function (error, results, fields){
                if (error) throw error;
                res.json(results);
            })
        } catch (err) {
            console.log(err);
            res.send(err);
        }
    });

router.route('/execution-sum')
    .get(parseUrlencoded, parseJSON, (req, res) => {
        try {
            db.query('SELECT pass.passID, SUM(bandwidthUsage), SUM(powerConsumption)' + 
                'FROM cubesat.passes as pass' +
                'RIGHT JOIN cubesat.queuedTelecommands as qtc' +
                'ON pass.passID = qtc.executionPassID' +
                'LEFT JOIN cubesat.telecommands as tc' + 
                'ON qtc.telecommandID = tc.telecommandID' + 
                'GROUP BY pass.passID;', function (error, results, fields){
                if (error) throw error;
                res.json(results);
            })
        } catch (err) {
            console.log(err);
            res.send(err);
        }
    });

module.exports = router;