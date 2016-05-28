﻿import {Control} from "VSS/Controls";
import {RecentlyViewedList, IRecentlyViewedListOptions} from "scripts/Controls/RecentlyViewedList";
import {RecentlyViewedGrid} from "scripts/Controls/RecentlyViewedGrid";
import {WorkItemVisit, Constants} from "scripts/Models";
import * as VisitManager from "scripts/VisitManager";
import {IWorkItemFormService, WorkItemFormService} from "TFS/WorkItemTracking/Services";
import {StatusIndicator, IStatusIndicatorOptions} from "VSS/Controls/StatusIndicator";

export class RecentlyViewedFullView  {
    private _statusIndicator: StatusIndicator;
    
    public initialize() {

        var rvGrid = <RecentlyViewedGrid>Control.createIn(
            RecentlyViewedGrid, 
            $(".rv-fullView"));
                   
        WorkItemFormService.getService().then((workItemFormService:any) => {
            workItemFormService.getId().then((workItemId) => {       
                VisitManager.manager.getWorkItemVisits(workItemId).then((visits) => {
                    
                    VSS.notifyLoadSucceeded(); 
                    rvGrid.render(workItemId, visits);
                });
            });
        });

    }
}


export class RecentlyViewedGroupView  {
    private _statusIndicator: StatusIndicator;
    private _renderedWorkItem: number;
    
    public initialize() {
        
        let isFirstLoad = true;
        this._statusIndicator = <StatusIndicator>Control.createIn<IStatusIndicatorOptions>(StatusIndicator,
                 $(".rv-group"),
                { center: true,  imageClass: "big-status-progress" });
                
        
        var rvList = <RecentlyViewedList>Control.createIn<IRecentlyViewedListOptions>(
            RecentlyViewedList, 
            $(".rv-group"), 
            { maxCount: Constants.GroupViewVisitCount });
        
        var render = (workItemId) => {
            
            // If we already rendered this bail out
            if(workItemId === this._renderedWorkItem) {
                return;
            }
            
            this._renderedWorkItem = workItemId;
            
            if(!isFirstLoad) {
                this._statusIndicator.start();
                $(".rv-group .rv-container").empty();
            }
            
            $(".rv-fullViewLink").hide();
            VisitManager.manager.getWorkItemVisits(workItemId).then((visits) => {
                
                if (isFirstLoad) {
                    VSS.notifyLoadSucceeded(); 
                    isFirstLoad = false;
                    rvList.render(workItemId, visits);     
                    this._renderFullViewButton();
                }
                else {
                    this._statusIndicator.complete();
                    rvList.render(workItemId, visits);
                }
                
                if(visits.length > 0) {
                    $(".rv-empty").hide();
                    $(".rv-fullViewLink").show();
                }
                else {
                    $(".rv-fullViewLink").hide();
                    $(".rv-empty").show();
                }
            });
        };

        WorkItemFormService.getService().then((workItemFormService:any) => {
           workItemFormService.getId().then((workItemId) => {
               render(workItemId);
           });
        });
        
        VisitManager.manager.registerOnLoadCallback(render);
        VisitManager.manager.registerOnRefreshedCallback((workItemId) => {
            this._renderedWorkItem = null; // Clear this before we re-render
            render(workItemId);
        });
        
        VisitManager.manager.registerOnSavedCallback((workItemId) => {
            this._renderedWorkItem = null; // Clear this before we re-render
            render(workItemId);
        });
        
    }
    
    
    private _renderFullViewButton() {
        
        let $emptyGroupText = $("<div class='rv-empty'>No one else has viewed this yet.</div>")
        let $fullViewLink = $("<div class='rv-fullViewLink' />").append("<button class='btn btn-secondary'>View All</button>");
        $fullViewLink.click(() => {
            this._showDialog();
        })
        
        $fullViewLink.appendTo($(".rv-group"));
        $emptyGroupText.appendTo($(".rv-group"));
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