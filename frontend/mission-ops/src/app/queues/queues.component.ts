import { Component, OnInit } from '@angular/core';
import { Pass } from 'src/classes/pass';
import { PassService } from 'src/app/services/pass/pass.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CreateQueuedTelecommandComponent } from '../create-queued-telecommand/create-queued-telecommand.component';
import { TelecommandService } from 'src/app/services/telecommand/telecommand.service';
import { Telecommand } from 'src/classes/telecommand';
import { QueuedTelecommandService } from 'src/app/services/queuedTelecommand/queued-telecommand.service';
import { AuthService } from 'src/app/services/auth/auth.service';
import { QueuedTelecommand } from 'src/classes/queuedTelecommand';
import { Observable, forkJoin, empty, of } from 'rxjs';
import { mergeMap, delay } from 'rxjs/operators';
import { PassLimitService } from 'src/app/services/pass-limit/pass-limit.service';
import { PassLimit } from 'src/classes/pass-limit';
import { TelecommandBatchService } from 'src/app/services/telecommandBatch/telecommand-batch.service';
import { TelecommandBatch } from 'src/classes/telecommandBatch';
import { PresetTelecommandService } from 'src/app/services/presetTelecommand/preset-telecommand.service';
import { PassSum } from 'src/classes/pass-sum';
import { CreatePassComponent } from '../create-pass/create-pass.component';

import { ToastrService } from 'ngx-toastr';

const dateFormat = require('dateformat');

@Component({
  selector: 'app-queues',
  templateUrl: './queues.component.html',
  styleUrls: ['./queues.component.scss','../../../node_modules/ngx-toastr/toastr.css']
})
export class QueuesComponent implements OnInit {

  executionQueue: boolean;
  transmissionQueue: boolean;
  futurePasses: Pass[];
  pastPasses: Pass[];
  telecommands: Telecommand[];
  telecommandBatches: TelecommandBatch[];
  passLimits: PassLimit[];
  selectedPass: Pass;
  calculatedTransmissionID: number;
  calculatedExecutionID: number;

  sumTransmissionResults : PassSum[];
  sumExecutionResults : PassSum[];

  additionSuccessStr: string = "";
  additionFailureStr: string = "";

  constructor(private passService: PassService,
    private modalService: NgbModal,
    private telecommandService: TelecommandService,
    private telecommandBatchService: TelecommandBatchService,
    private presetTelecommandService: PresetTelecommandService,
    private queuedTelecommandService: QueuedTelecommandService,
    private passLimitService: PassLimitService,
    private auth: AuthService,
    private toastr: ToastrService) { }

  ngOnInit() {
    this.executionQueue = false;
    this.transmissionQueue = true;
    this.getPasses();
    this.getTelecommands();
    this.getPassLimits();
    this.getTelecommandBatches();
  }

  getFormatedDate(unformatedDate: Date)
  {
    return dateFormat(unformatedDate, "dddd, mmmm dS, yyyy, HH:MM:ss");
  }

  selectExecution(): void{  
    console.log('exec');
    this.executionQueue = true;
    this.transmissionQueue = false;
  }

  selectTransmission(): void{  
    console.log('trans');
    this.executionQueue = false;
    this.transmissionQueue = true;
  }

  onSelect(pass: Pass) : void
  {
    this.selectedPass = pass;
  }

  getPasses() : void{   
    this.selectedPass = null; 
    this.passService.getPasses()
      .subscribe(passes => {
        this.pastPasses = passes.filter(x => x.passHasOccurred);
        this.futurePasses = passes.filter(x => !x.passHasOccurred);
      });
  }

  getTelecommands() : void
  {
    this.telecommandService.getTelecommands()
      .subscribe(tcs => {
        this.telecommands = tcs;
      });
  }

  getTelecommandBatches() : void
  {
    this.telecommandBatchService.getTelecommandBatches()
      .subscribe(tbs => this.telecommandBatches = tbs);
  }

  getPassLimits() : void
  {
    this.passLimitService.getPassLimits()
      .subscribe(pls => this.passLimits = pls);
  }

  promptAddPass() : void{
    const modalRef = this.modalService.open(CreatePassComponent);
    modalRef.result.then((result) => {
      this.passService.createPass(result)
        .subscribe(pass => {
          this.getPasses();
          this.toastr.success('Successfully created a new pass.');
        });
    }).catch((error) => {
      // Modal closed without submission
      console.log(error);
    });
  }

  promptAddQueuedTelecommand() : void
  {
    const modalRef = this.modalService.open(CreateQueuedTelecommandComponent);
    modalRef.componentInstance.isBatch = false;
    modalRef.componentInstance.telecommands = this.telecommands;
    modalRef.result.then((result) => {
      var userID = this.auth.getCurrentUser().id;
      var executionTime = new Date(Date.UTC(
        result.executionDate.year,
        result.executionDate.month-1,
        result.executionDate.day,
        result.executionTime.hour,
        result.executionTime.minute,
        result.executionTime.second
      ));
      var createQtc = (self, maxBandwidth, maxPower, activePasses) => {
        var activeTelecommand = this.telecommands.find(x => x.telecommandID == result.telecommandID);
        var [transID, execID] = self.calculatePassIDs(activePasses, activeTelecommand, executionTime, maxBandwidth, maxPower);
        if (transID === -1 || execID === -1) return of(null);
        var newQtc = new QueuedTelecommand(
          execID,
          transID,
          userID,
          result.telecommandID,
          result.priorityLevel,
          executionTime,
          result.commandParams,
        );
        this.additionSuccessStr = `Queued telecommand ${activeTelecommand.name} for transmission in pass ${transID} and execution in pass ${execID}.\n`;
        return self.queuedTelecommandService.createBatchQueuedTelecommands(
          [Object.values(newQtc)]
        );
      }
      this.createQueuedTelecommands(createQtc);
    }).catch((error) => {
      // Modal closed without submission
      console.log(error);
    });
  }

  promptAddQueuedTelecommandBatch() : void
  {
    const modalRef = this.modalService.open(CreateQueuedTelecommandComponent);
    modalRef.componentInstance.isBatch = true;
    modalRef.componentInstance.telecommandBatches = this.telecommandBatches;
    modalRef.result.then((result) => {
      var userID = this.auth.getCurrentUser().id;
      console.log(result.executionDate, result.executionTime);
      var executionTime = new Date(Date.UTC(
        result.executionDate.year,
        result.executionDate.month-1, // Indexed from 0. Why. WHY.
        result.executionDate.day,
        result.executionTime.hour,
        result.executionTime.minute,
        result.executionTime.second
      ));
      this.presetTelecommandService.getPresetTelecommands(result.telecommandBatchID)
        .subscribe(ptcs => {
          var createQtc = (self, maxBandwidth, maxPower, activePasses) => {
            var pQtcBatch = [];
            var isValid = true;
            this.additionSuccessStr = "";
            for (var i = 0; i < ptcs.length; i++){
              if (!isValid) continue;
              var telecommandExecutionTime = new Date(executionTime.getTime());
              telecommandExecutionTime.setUTCDate(executionTime.getUTCDate() + ptcs[i].dayDelay);
              telecommandExecutionTime.setUTCHours(executionTime.getUTCHours() + ptcs[i].hourDelay);
              telecommandExecutionTime.setUTCMinutes(executionTime.getUTCMinutes() + ptcs[i].minuteDelay);
              telecommandExecutionTime.setUTCSeconds(executionTime.getUTCSeconds() + ptcs[i].secondDelay);
              var activeTelecommand = this.telecommands.find(x => x.telecommandID == ptcs[i].telecommandID);
              var [transID, execID] = self.calculatePassIDs(activePasses, activeTelecommand, telecommandExecutionTime, maxBandwidth, maxPower);
              if (transID === -1 || execID === -1) isValid = false;
              pQtcBatch.push(Object.values(new QueuedTelecommand(
                execID,
                transID,
                userID,
                ptcs[i].telecommandID,
                ptcs[i].priorityLevel,
                telecommandExecutionTime,
                ptcs[i].commandParameters,
              )));
              this.additionSuccessStr += `Queued telecommand ${activeTelecommand.name} for transmission in pass ${transID} and execution in pass ${execID}.\n`;
            }
            if (isValid) {
              return self.queuedTelecommandService.createBatchQueuedTelecommands(
                pQtcBatch
              );
            }
            return of(null);
          }
          this.createQueuedTelecommands(createQtc);
        });
    }).catch((error) => {
      // Modal closed without submission
      console.log(error);
    });
  }

  /**
   * Must have at least one active pass and pass limits must exist.
   */
  createQueuedTelecommands(qtcCreation: (self, maxB: number, maxP: number, activeP: Pass[]) => Observable<any>) : void
  {
    var maxBandwidth = this.passLimits.find(x => x.name == "bandwidthUsage").maxValue;
    var maxPower = this.passLimits.find(x => x.name == "powerConsumption").maxValue;

    let passTransmissionSums = this.passService.getPassTransmissionSums();
    let passExecutionSums = this.passService.getPassExecutionSums();
    forkJoin([passTransmissionSums, passExecutionSums])
      .pipe(mergeMap(results => {
        this.sumTransmissionResults = results[0];
        this.sumExecutionResults = results[1];
        return qtcCreation(this, maxBandwidth, maxPower, this.futurePasses);
      }))
      .subscribe(() => {
        console.log('sub');
        if (this.additionFailureStr === ""){
          var additionSuccesses = this.additionSuccessStr.split('\n');
          for (var i = 0; i < additionSuccesses.length-1; i++){
            this.toastr.success(additionSuccesses[i]);
          }
        } else {
          this.toastr.error(this.additionFailureStr);
        }
        this.additionFailureStr = "";
        this.additionSuccessStr = "";
        this.getPasses();
      });
  }

  calculatePassIDs(activePasses: Pass[], activeTelecommand: Telecommand, executionTime: Date, maxBandwidth: number, maxPower: number) : [number, number]
  {
    var calcTransID, calcExecID;
    
    // Execution
    if (!this.sumExecutionResults) {
      calcExecID = activePasses[0].passID;
    } 
    else {
      for (var i = 0; i < activePasses.length; i++) {
        if (executionTime.getTime() > new Date(activePasses[i].estimatedPassDateTime).getTime()) continue;
        if (i == 0) {
          this.additionFailureStr = 'No pass exists to execute this command. Create a new pass and try again.';
          break;
        }
        var passSum = this.sumExecutionResults.find(x => x.passID == activePasses[i-1].passID);

        // Limit passes on power.
        if (!passSum || passSum.sumPower + activeTelecommand.powerConsumption <= maxPower)
        {
          if (!passSum && activeTelecommand.powerConsumption > maxPower){
            this.additionFailureStr = 'Error: Cannot add telecommand to queue. Telecommand power consumption exceeds the maximum power limitation in one pass.'
            break;
          }
          calcExecID = activePasses[i].passID;
          if (!passSum) {
            console.log('pushed from exec', activeTelecommand);
            this.sumExecutionResults.push({passID: calcExecID, sumBandwidth: activeTelecommand.bandwidthUsage, sumPower: activeTelecommand.powerConsumption});
          }
          break;
        } else {
          this.additionFailureStr = 'Error: Pass capacity reached. Cannot queue telecommand within specified pass.';
          break;
        }
      }
    }
    if (!calcExecID) {
      // TODO: if it fits in no existing passes, create a new pass and plop this telecommand in there.
      if (this.additionFailureStr === "") this.additionFailureStr = 'No passes currently exist that will contain the requested telecommand(s). Create a new pass or modify the maximum pass limits and try again.';
      return [-1,-1];
    }

    // Transmission
    if (!this.sumExecutionResults) {
      calcTransID = activePasses[0].passID;
    }
    else {
      for (var i = 0; i < activePasses.length; i++) {
        var passSum = this.sumTransmissionResults.find(x => x.passID == activePasses[i].passID);

        // Limit passes on bandwidth.
        if (!passSum || passSum.sumBandwidth + activeTelecommand.bandwidthUsage <= maxBandwidth)
        {
          if (!passSum && activeTelecommand.bandwidthUsage > maxBandwidth){
            this.additionFailureStr = 'Error: Cannot add telecommand to queue. Telecommand bandwidth usage exceeds the maximum bandwidth limitation in one pass.'
            break;
          }
          calcTransID = activePasses[i].passID;
          if (!passSum) {
            console.log('pushed from trans', activeTelecommand);
            this.sumTransmissionResults.push({passID: calcTransID, sumBandwidth: activeTelecommand.bandwidthUsage, sumPower: activeTelecommand.powerConsumption});
          }
          break;
        }
      }
      if (!calcTransID) {
        // TODO: if it fits in no existing passes, create a new pass and plop this telecommand in there.
        if (this.additionFailureStr === "") this.additionFailureStr = 'No passes currently exist that will contain the requested telecommand(s). Create a new pass or modify the maximum pass limits and try again.';
        return [-1,-1];
      }
    }

    console.log(calcTransID, calcExecID, this.sumExecutionResults);
    this.sumTransmissionResults.find(x => x.passID == calcTransID).sumBandwidth += activeTelecommand.bandwidthUsage;
    this.sumTransmissionResults.find(x => x.passID == calcTransID).sumPower += activeTelecommand.powerConsumption;
    this.sumExecutionResults.find(x => x.passID == calcExecID).sumBandwidth += activeTelecommand.bandwidthUsage;
    this.sumExecutionResults.find(x => x.passID == calcExecID).sumPower += activeTelecommand.powerConsumption;

    return [calcTransID, calcExecID];
  }
}
