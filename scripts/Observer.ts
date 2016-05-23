/// <reference path='../typings/tsd.d.ts' />
import Q = require("q");
import * as VSSService from "VSS/Service";
import * as Utils_Core from "VSS/Utils/Core";
import * as Utils_String from "VSS/Utils/String";
import {IWorkItemFormService, WorkItemFormService} from "TFS/WorkItemTracking/Services";
import * as WitClient from "TFS/WorkItemTracking/RestClient"
import * as WitContracts  from "TFS/WorkItemTracking/Contracts";
import * as WitExtensionContracts  from "TFS/WorkItemTracking/ExtensionContracts";
import * as Models from "scripts/Models";

var observerProvider = () => {

    var _visitDelegate =
        (visitedId) => {
            if (visitedId > 0) {
                WorkItemFormService.getService().then(
                    // casting to any for now since the typescript doesn't treat the calls as promises
                    (workItemFormService: any) => {
                        workItemFormService.getId().then((currentId: number) => {
                            // Only log the visit if we're still on this work item.  If they
                            // didn't look for too long, it shouldn't be considered as a visit.
                            if (visitedId == currentId) {
                                manager.recordVisit(visitedId);
                            }
                        });
                    });
            }
        };

    return {
        // Called when a new work item is being loaded in the UI
        onLoaded: (args: WitExtensionContracts.IWorkItemLoadedArgs) => {
            
            if (args && !args.isNew) {
                console.log(`onloaded:${args.id}`);
                manager.fireOnLoadCallback(args.id);
                Utils_Core.delay(this, 3000, _visitDelegate, [args.id])
            } else {
                manager.fireOnLoadCallback(null);
            }
        },
        
        
        onUnloaded: (args: WitExtensionContracts.IWorkItemChangedArgs) => {
            
            if (args) {
                console.log(`onloaded:${args.id}`);
                manager.fireOnUnloadCallback(args.id);
            }
            else{
                manager.fireOnUnloadCallback(null);
            }
        },
        
    }
};

VSS.register(`${Models.Constants.ExtensionPublisher}.${Models.Constants.ExtensionName}.recently-viewed-form-group`, observerProvider);
VSS.register('recently-viewed-form-group', observerProvider);

export class VisitManager {
    constructor() {
    }

    private workItemLoadedCallback = null;
    private workItemUnloadedCallback = null;
    
    public registerOnLoadCallback(callback: ((number) => void)){
        this.workItemLoadedCallback = callback;
    }    
    
    public registerOnUnloadCallback(callback: ((number) => void)){
        this.workItemUnloadedCallback = callback;
    }
    
    public fireOnLoadCallback(id: number){
        if(this.workItemLoadedCallback){
            this.workItemLoadedCallback(id);
        }
    } 
    
    public fireOnUnloadCallback(id: number){
        if(this.workItemUnloadedCallback){
            this.workItemLoadedCallback(id);
        }
    }


    public recordVisit(workItemId: number, revision?: number): IPromise<void> {
        console.log(`Visited work item ${workItemId}`);
        var defer = Q.defer<void>();

        this._beginGetVisits(workItemId).then((visits) => {
            if (!visits) {
                visits = [];
            }

            this._mergeVisits(workItemId, revision, visits);
            defer.resolve(null);
        }, () => {
            // This happens on first time get the document
            var visits: Models.WorkItemVisit[] = [];

            this._mergeVisits(workItemId, revision, visits);
            defer.resolve(null);
        });

        return defer.promise;
    }

    public getWorkItemVisits(workItemId: number): IPromise<Models.WorkItemVisit[]> {
        var defer = Q.defer<Models.WorkItemVisit[]>();
        
        var workItemVisits: Models.WorkItemVisit[] = [];
        this._beginGetVisits(workItemId).then((visits) => {
            if (visits && visits.length > 0) {
                defer.resolve(visits);
            }
            else {
                defer.resolve(workItemVisits);
            }
        });

        return defer.promise;
    }

    public resetWorkItemVisits(id: number): IPromise<void> {
        var defer = Q.defer<void>();
        var visits: Models.WorkItemVisit[] = [];

        VSS.getService<IExtensionDataService>(VSS.ServiceIds.ExtensionData).then((dataService: IExtensionDataService) => {
            dataService.setValue<Models.WorkItemVisit[]>(Models.getStorageKey(id), visits);
            defer.resolve(null);
        });

        return defer.promise;
    }

    private _beginGetVisits(id: number): IPromise<Models.WorkItemVisit[]> {
        var defer = Q.defer();

        VSS.getService<IExtensionDataService>(VSS.ServiceIds.ExtensionData).then((dataService: IExtensionDataService) => {
            dataService.getValue<Models.WorkItemVisit[]>(Models.getStorageKey(id)).then((visits) => {
                defer.resolve(visits);
            }, (reason) => {
                console.error(`Unable to get visits: ${reason}`);
            });
        });

        return defer.promise;
    }

    private _mergeVisits(id: number, revision: number, visits: Models.WorkItemVisit[]): void {
        var visitDate = new Date();
        var visit = new Models.WorkItemVisit();

        // toJSON correctly formats a date string for json serialization/deserialization
        visit.date = visitDate.toJSON();
        visit.workItemId = id;
        visit.user = VSS.getWebContext().user;
           
        if (revision > 0) {
            visit.revision = revision;
        }

        if(visits.length > Models.Constants.MaxVisitsToStore){
            var deltaCount = visits.length - Models.Constants.MaxVisitsToStore;
            visits = visits.splice(deltaCount);
        }
        
        visits.push(visit);

        VSS.getService<IExtensionDataService>(VSS.ServiceIds.ExtensionData).then((dataService: IExtensionDataService) => {
            dataService.setValue<Models.WorkItemVisit[]>(Models.getStorageKey(id), visits);
        });
    }

}


export var manager = new VisitManager();
