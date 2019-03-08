﻿import { Telecommand } from './telecommand';

export class QueuedTelecommand {
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
    priorityLevel: boolean;

    
    /**
     * The date and time in UTC at which point the queued command will be executed
     *
     * @type {Date}
     * @memberof QueuedTelecommand
     */
    executionTime: Date;

    /**
     *Creates an instance of QueuedTelecommand.
     * @param {number} id The unique ID of the queuedTelecommand
     * @param {Telecommand} telecommandID The command to be executed
     */
    constructor(userID: number, telecommandID: number) {
        this.userID = userID;
        this.telecommandID = telecommandID;
    }
}