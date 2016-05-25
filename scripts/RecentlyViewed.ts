/// <reference path='../typings/tsd.d.ts' />
import {Control} from "VSS/Controls";
import {RecentlyViewedList, IRecentlyViewedListOptions} from "scripts/Controls/RecentlyViewedList";
import {RecentlyViewedGrid} from "scripts/Controls/RecentlyViewedGrid";
import {WorkItemVisit, Constants} from "scripts/Models";
import * as Observer from "scripts/Observer";
import {IWorkItemFormService, WorkItemFormService} from "TFS/WorkItemTracking/Services";


function getWorkItemVisits(workItemId: number){
    
}

export class RecentlyViewedFullView  {
   public initialize() {
        console.log("RecentlyViewedFullView loading");

        var rvGrid = <RecentlyViewedGrid>Control.createIn(
            RecentlyViewedGrid, 
            $(".rv-fullView"));
        
        WorkItemFormService.getService().then((workItemFormService:any) => {
           workItemFormService.getId().then((workItemId) => {       
                Observer.manager.getWorkItemVisits(workItemId).then((visits) => {
                    rvGrid.render(workItemId, visits);
                });
           });
        });

    }
}



export class RecentlyViewedGroupView  {
    public initialize() {
        console.log("RecentlyViewedGroupView loading");

        var rvList = <RecentlyViewedList>Control.createIn<IRecentlyViewedListOptions>(
            RecentlyViewedList, 
            $(".rv-group"), 
            { maxCount: Constants.GroupViewVisitCount });
        
        var render = (workItemId) => {
            Observer.manager.getWorkItemVisits(workItemId).then((visits) => {
                rvList.render(workItemId, visits);
            });
        };
        
        let $fullViewLink = $("<div class='rv-fullViewLink' />").append("<button class='btn btn-secondary'>Full View</button>");
        $fullViewLink.click(() => {
            this._showDialog();
        })
        
        $fullViewLink.appendTo($(".rv-group"));
        
        WorkItemFormService.getService().then((workItemFormService:any) => {
           workItemFormService.getId().then((workItemId) => {
               render(workItemId);
           });
        });
        
        Observer.manager.registerOnLoadCallback(render);
    }
    
     private _showDialog() {
        VSS.getService(VSS.ServiceIds.Dialog).then((dialogService: IHostDialogService) => {
            
            var extInfo = VSS.getExtensionContext();

            var dialogOptions: IHostDialogOptions = {
                title: "Who viewed this work item?",
                width: 800,
                height: 600,
                buttons: null
            };

            var contributionConfig = {
            };

            dialogService.openDialog(
                `${Constants.ExtensionPublisher}.${Constants.ExtensionName}.recently-viewed-dialog`,
                dialogOptions,
                contributionConfig);
        });
    }
}