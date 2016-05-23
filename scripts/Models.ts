export class WorkItemVisit {
    public workItemId: number;
    public revision: number;
    public date: string;
    public user: UserContext;
}

export class IdentityReference {
    id: string;
    displayName: string;
    uniqueName: string;
    isIdentity: boolean;
}

export class Constants {
    public static StorageKey: string = "WorkItemVisits";
    public static UtcRegex = /\d+-\d+-\d+T\d+:\d+:\d+\.\d+Z/;
    
    public static ExtensionPublisher = "mmanela";
    public static ExtensionName = "vsts-workitem-recentlyviewed";
    
    public static MaxVisitsToStore = 1000;
    
    public static GroupViewVisitCount = 4;
}


export function getStorageKey(workItemId: number){
    return `TEMP2-${Constants.StorageKey}-${workItemId}`;
}