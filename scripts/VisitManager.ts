import Q = require("q");
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
                manager.fireOnLoadCallback(args.id);
                Utils_Core.delay(this, 3000, _visitDelegate, [args.id])
            } else {
                manager.fireOnLoadCallback(null);
            }
        },
        
        
        onUnloaded: (args: WitExtensionContracts.IWorkItemChangedArgs) => {
            
            if (args) {
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

class VisitManager {
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

    public recordVisit(workItemId: number): IPromise<Models.WorkItemVisitsDocument> {
        console.log(`Recording visit for work item ${workItemId}`);
        return this._recordVisitWithRetries(workItemId, Models.Constants.RecordRetryAttempts);
    }

    private _recordVisitWithRetries(workItemId: number, attempt: number): IPromise<Models.WorkItemVisitsDocument> {
        if(attempt === 0) {
            return Q.reject('Unable to record visit due to repeated concurrency issues');
        }
        
        let update = (doc:Models.WorkItemVisitsDocument) => {
           return this._updateVisitDocument(doc).then((updatedDoc) => {
                return Q(updatedDoc);
            }, (reason) => {
                return this._recordVisitWithRetries(workItemId, --attempt);
            });
        };
        
        return this._getVisitsDocument(workItemId).then((document) => {
            if (!document) {
                document = new Models.WorkItemVisitsDocument(workItemId);
            }

            return update(document);
            
        }, () => {
            // This happens on first time get the document
            return update(new Models.WorkItemVisitsDocument(workItemId));
        });

    }

    public getWorkItemVisits(workItemId: number): IPromise<Models.WorkItemVisit[]> {
        var defer = Q.defer<Models.WorkItemVisit[]>();
        
        var workItemVisits: Models.WorkItemVisit[] = [];
        this._getVisitsDocument(workItemId).then((document) => {
            if (document && document.workItemId === workItemId && document.visits) {
                defer.resolve(document.visits);
            }
            else {
                defer.resolve(workItemVisits);
            }
        }, (reason) => {
             defer.resolve(workItemVisits);
        });

        return defer.promise;
    }

    public deleteVisitsDocument(workItemId: number): IPromise<void> {
        var defer = Q.defer<void>();

        VSS.getService<IExtensionDataService>(VSS.ServiceIds.ExtensionData).then((dataService: IExtensionDataService) => {
            dataService.deleteDocument(Models.Constants.DocumentCollectionName, Models.getStorageKey(workItemId));
            defer.resolve(null);
        });

        return defer.promise;
    }

    private _getVisitsDocument(id: number): IPromise<Models.WorkItemVisitsDocument> {
        var defer = Q.defer();

        VSS.getService<IExtensionDataService>(VSS.ServiceIds.ExtensionData).then((dataService: IExtensionDataService) => {
            dataService.getDocument(Models.Constants.DocumentCollectionName, Models.getStorageKey(id)).then((document) => {
                defer.resolve(document);
            }, (reason) => {
                defer.reject(`Unable to get visits: ${reason}`);
            });
        });

        return defer.promise;
    }

    private _updateVisitDocument(document: Models.WorkItemVisitsDocument): IPromise<Models.WorkItemVisitsDocument> {
        var visitDate = new Date();
        var visit = new Models.WorkItemVisit();

        // toJSON correctly formats a date string for json serialization/deserialization
        visit.date = visitDate.toJSON();
        visit.workItemId = document.workItemId;
        visit.user = VSS.getWebContext().user;
           
        if(document.visits.length > Models.Constants.MaxVisitsToStore){
            var deltaCount = document.visits.length - Models.Constants.MaxVisitsToStore;
            document.visits = document.visits.splice(deltaCount);
        }
        
        document.visits.push(visit);

       return  VSS.getService<IExtensionDataService>(VSS.ServiceIds.ExtensionData).then((dataService: IExtensionDataService) => {
            return dataService.setDocument(Models.Constants.DocumentCollectionName, document);
        }, (reason) => {
            return Q.reject(`Unable to set visits: ${reason}`);
        });
    }

}


export var manager = new VisitManager();
