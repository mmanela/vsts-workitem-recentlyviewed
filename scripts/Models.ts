export class WorkItemVisit {
    public workItemId: number;
    public revision: number;
    public date: string;
    public user: UserContext;
}


export class Constants {
    public static StorageKey: string = "WorkItemVisits";
    public static UtcRegex = /\d+-\d+-\d+T\d+:\d+:\d+\.\d+Z/;
    
    public static ExtensionPublisher = "mmanela";
    public static ExtensionName = "vsts-workitem-recentlyviewed";
    
    public static MaxVisitsToStore = 1000;
    
    public static GroupViewVisitCount = 4;
    
    public static FullDateString = 'MMMM Do YYYY, h:mm:ss a';
}


export function getStorageKey(workItemId: number){
    return `TEMP2-${Constants.StorageKey}-${workItemId}`;
}