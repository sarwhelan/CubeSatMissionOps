﻿export class QueuedTelecommand {
    /**
     * The unique ID of the queuedTelecommand
     *
     * @type {number}
     * @memberof QueuedTelecommand
     */
    queuedTelecommandID: number;

    /**
     * The execution pass ID.
     * 
     * @type {number}
     * @memberof QueuedTelecommand
     */
    executionPassID: number;

    /**
     * The transmission pass ID.
     * 
     * @type {number}
     * @memberof QueuedTelecommand
     */
    transmissionPassID: number;

    /**
     * The user that queued the command
     *
     * @type {number}
     * @memberof QueuedTelecommand
     */
    userID : number;


    /**
     *The command to be executed
     *
     * @type {Telecommand}
     * @memberof QueuedTelecommand
     */
    telecommandID: number;


    /**
     * The priority level of the command. Higher priority commands
     * are sent to the CubeSat earlier in the link connection
     *
     * @type {boolean}
     * @memberof QueuedTelecommand
     */
    priority: boolean;

    
    /**
     * The date and time in UTC at which point the queued command will be executed
     *
     * @type {Date}
     * @memberof QueuedTelecommand
     */
    executionTimeUTC: Date;

    /**
     * The command parameter JSON, stringified.
     * 
     * @type {string}
     * @memberof QueuedTelecommand
     */
    commandParameters: string;

    /**
     * Creates an instance of QueuedTelecommand.
     * @param {number} id The unique ID of the queuedTelecommand
     * 
     * 
     * @param {Telecommand} telecommandID The command to be executed
     * @param {Boolean} priorityLevel The assigned priority level.
     * @param {Date} executionTime The assigned execution time.
     */
    constructor( 
        executionPassID: number,
        transmissionPassID: number,
        userID: number,
        telecommandID: number, 
        priorityLevel: boolean,
        executionTime: Date,
        commandParams: string) {
        this.userID = userID;
        this.executionPassID = executionPassID;
        this.transmissionPassID = transmissionPassID;
        this.telecommandID = telecommandID;
        this.priority = priorityLevel;
        this.executionTimeUTC = executionTime;
        this.commandParameters = commandParams;
    }
}