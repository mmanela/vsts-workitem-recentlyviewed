/// <reference path='../typings/tsd.d.ts' />
import {Control} from "VSS/Controls";
import * as Controls from "scripts/Controls";
import {WorkItemVisit, Constants} from "scripts/Models";
import * as Observer from "scripts/Observer";
import {IWorkItemFormService, WorkItemFormService} from "TFS/WorkItemTracking/Services";

export class RecentlyViewedGroupView  {
    public initialize() {
        console.log("RecentlyViewed.js loading");

        var rvList = <Controls.RecentlyViewedList>Control.createIn<Controls.IRecentlyViewedListOptions>(
            Controls.RecentlyViewedList, 
            $(".rv-group"), 
            { maxCount: Constants.GroupViewVisitCount });
        
        var render = (workItemId) => {
            Observer.manager.getWorkItemVisits(workItemId).then((visits) => {
                rvList.render(workItemId, visits);
            });
        };
        
        let $fullViewLink = $("<div class='rv-fullViewLink' />").append("<button class='btn btn-secondary'>Full View</button>");
        $fullViewLink.click(() => {
            console.log("Show full view");
        })
        
        $fullViewLink.appendTo($(".rv-group"));
        
        WorkItemFormService.getService().then((workItemFormService:any) => {
           workItemFormService.getId().then((workItemId) => {
               render(workItemId);
           });
        });
        
        Observer.manager.registerOnLoadCallback(render);
    }
}