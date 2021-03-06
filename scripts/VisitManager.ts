﻿import * as Utils_Core from "VSS/Utils/Core";
import * as Utils_String from "VSS/Utils/String";
import {WorkItemFormService} from "TFS/WorkItemTracking/Services";
import * as WitExtensionContracts  from "TFS/WorkItemTracking/ExtensionContracts";
import * as Models from "./Models";
import * as moment from "moment";

var observerProvider = () => {

    var _visitDelegate =
        (visitedId) => {
            if (visitedId > 0) {
                WorkItemFormService.getService().then(
                    (workItemFormService) => {
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
                Utils_Core.delay(this, Models.Constants.MinTimeOnWorkItemInSeconds, _visitDelegate, [args.id]);
            } else {
                manager.fireOnLoadCallback(null!);
            }
        },
        
        onSaved: (args: WitExtensionContracts.IWorkItemChangedArgs) => {
            if (args && args.id > 0) {
                 _visitDelegate(args.id);
                 manager.fireOnSavedCallback(args.id);
            }
            
        },        
        onRefreshed: (args: WitExtensionContracts.IWorkItemChangedArgs) => {
            if (args && args.id > 0) {
                 _visitDelegate(args.id);
                 manager.fireOnRefreshedCallback(args.id);
            }
            
        }, 
        onUnloaded: (args: WitExtensionContracts.IWorkItemChangedArgs) => {
            
            if (args) {
                manager.fireOnUnloadCallback(args.id);
            }
            else{
                manager.fireOnUnloadCallback(null!);
            }
        },
        
    }
};

VSS.register(`${Models.Constants.ExtensionPublisher}.${Models.Constants.ExtensionName}.recently-viewed-form-group`, observerProvider);
VSS.register('recently-viewed-form-group', observerProvider);

class VisitManager {
    constructor() {
    }

    private workItemLoadedCallback: ((number?: number) => void);
    private workItemSavedCallback: ((number?: number) => void);
    private workItemRefreshedCallback: ((number?: number) => void);
    private workItemUnloadedCallback: ((number?: number) => void);
    
    public registerOnLoadCallback(callback: ((number?: number) => void)){
        this.workItemLoadedCallback = callback;
    }    
    
    public registerOnUnloadCallback(callback: ((number?: number) => void)){
        this.workItemUnloadedCallback = callback;
    }
    
    public registerOnSavedCallback(callback: ((number?: number) => void)){
        this.workItemSavedCallback = callback;
    }
    
    
    public registerOnRefreshedCallback(callback: ((number?: number) => void)){
        this.workItemRefreshedCallback = callback;
    }
    
    
    public fireOnLoadCallback(id?: number){
        if(this.workItemLoadedCallback){
            this.workItemLoadedCallback(id);
        }
    } 
    
    public fireOnUnloadCallback(id?: number){
        if(this.workItemUnloadedCallback){
            this.workItemUnloadedCallback(id);
        }
    }
    
    public fireOnSavedCallback(id?: number){
        if(this.workItemSavedCallback){
            this.workItemSavedCallback(id);
        }
    } 
    
    public fireOnRefreshedCallback(id?: number){
        if(this.workItemRefreshedCallback){
            this.workItemRefreshedCallback(id);
        }
    } 

    public recordVisit(workItemId: number): IPromise<Models.WorkItemVisitsDocument> {
        return this._recordVisitWithRetries(workItemId, Models.Constants.RecordRetryAttempts);
    }

    private _recordVisitWithRetries(workItemId: number, attempt: number): IPromise<Models.WorkItemVisitsDocument> {
        if(attempt === 0) {
            return Promise.reject('Unable to record visit due to repeated concurrency issues');
        }
        
        let update = (doc:Models.WorkItemVisitsDocument) => {
           return this._updateVisitDocument(doc).then((updatedDoc) => {
                return Promise.resolve(updatedDoc);
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

    public getWorkItemVisits(workItemId: number): Promise<Models.WorkItemVisit[]> {
        var promise = new Promise<Models.WorkItemVisit[]>((resolve, reject) => {
            if(workItemId === null) {
                resolve([]);
            }
            else {

                var workItemVisits: Models.WorkItemVisit[] = [];
                this._getVisitsDocument(workItemId).then((document) => {
                    if (document && document.workItemId === workItemId && document.visits) {
                        resolve(document.visits);
                    }
                    else {
                        resolve(workItemVisits);
                    }
                }, (reason) => {
                    resolve(workItemVisits);
                });
            }
        });
        return promise;
    }

    public deleteVisitsDocument(workItemId: number): Promise<void> {
        var promise = new Promise<void>((resolve, reject) => {
            VSS.getService<IExtensionDataService>(VSS.ServiceIds.ExtensionData).then((dataService: IExtensionDataService) => {
                dataService.deleteDocument(Models.Constants.DocumentCollectionName, Models.getStorageKey(workItemId));
                resolve();
            });
        });

        return promise;
    }

    private _getVisitsDocument(id: number): Promise<Models.WorkItemVisitsDocument> {
        
        var promise = new Promise<Models.WorkItemVisitsDocument>((resolve, reject) => {
            VSS.getService<IExtensionDataService>(VSS.ServiceIds.ExtensionData).then((dataService: IExtensionDataService) => {
                dataService.getDocument(Models.Constants.DocumentCollectionName, Models.getStorageKey(id)).then((document) => {
                    resolve(document);
                }, (reason) => {
                    reject(`Unable to get visits`);
                });
            });

        });

        return promise;
    }

    private _updateVisitDocument(document: Models.WorkItemVisitsDocument): IPromise<Models.WorkItemVisitsDocument> {
        let visitDate = new Date();
        let visit = new Models.WorkItemVisit();

        // toJSON correctly formats a date string for json serialization/deserialization
        visit.date = visitDate.toJSON();
        visit.workItemId = document.workItemId;
        visit.user = new Models.Visitor(VSS.getWebContext().user);
        
        // Loop over visits and see if the current user has visited less than MinTimeBetweenVisitsInSeconds
        // If so we ignore this visit
        let visitMoment = moment(visit.date);
        for(let i = document.visits.length -1; i >= 0; --i) {
            var pastVisit = document.visits[i];
            var previousMoment = moment(pastVisit.date);
            
            var enoughTimeHasPassed = visitMoment.diff(previousMoment, 'seconds') > Models.Constants.MinTimeBetweenVisitsInSeconds;
            if(enoughTimeHasPassed) {
                // If we found any item that is old enough we are ok since 
                // we recorded the visits in order
                break;
            }
            else if(Utils_String.ignoreCaseComparer(pastVisit.user.uniqueName, visit.user.uniqueName) === 0) {
                // If enough time has not passed since you last visit ignore this one
                return Promise.resolve(document);
            }
        }
        
        if(document.visits.length > Models.Constants.MaxVisitsToStore){
            let deltaCount = document.visits.length - Models.Constants.MaxVisitsToStore;
            document.visits = document.visits.splice(deltaCount);
        }
        
        document.visits.push(visit);

       return  VSS.getService<IExtensionDataService>(VSS.ServiceIds.ExtensionData).then((dataService: IExtensionDataService) => {
            return dataService.setDocument(Models.Constants.DocumentCollectionName, document);
        }, (reason) => {
            return Promise.reject(`Unable to set visits`);
        });
    }

}


export var manager = new VisitManager();
