var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
define(["require", "exports", "VSS/Controls", "VSS/Controls/Grids", "scripts/Models"], function (require, exports, Controls_1, Grids, Models_1) {
    "use strict";
    var RecentlyViewedGrid = (function (_super) {
        __extends(RecentlyViewedGrid, _super);
        function RecentlyViewedGrid() {
            _super.apply(this, arguments);
        }
        RecentlyViewedGrid.prototype.initialize = function () {
            _super.prototype.initialize.call(this);
            this._visitsContainer = $("<div/>").addClass("rv-container").appendTo(this.getElement());
        };
        RecentlyViewedGrid.prototype.render = function (workItemId, visits) {
            var _this = this;
            if (workItemId === this._currentWorkItemId) {
                return;
            }
            this._currentWorkItemId = workItemId;
            this._visitsContainer.empty();
            if (visits && visits.length > 0) {
                visits = visits.reverse();
                var gridSource = visits.map(function (visit) {
                    return {
                        Avatar: _this._getImageUrl(visit.user),
                        Name: visit.user.name,
                        Email: visit.user.email || visit.user.uniqueName,
                        Date: visit.date
                    };
                });
                var options = {
                    source: gridSource,
                    columns: this._getGridColumns(gridSource),
                    height: "100%",
                    useBowtieStyle: true
                };
                Grids.Grid.createIn(Grids.Grid, this._visitsContainer, options);
            }
        };
        RecentlyViewedGrid.prototype._getImageUrl = function (user) {
            var identityImageUrl = VSS.getWebContext().host.uri + "/_api/_common/IdentityImage?id=";
            identityImageUrl = identityImageUrl + "&identifier=" + user.uniqueName + "&identifierType=0";
            return identityImageUrl;
        };
        RecentlyViewedGrid.prototype._getGridColumns = function (visitGridRows) {
            if (!this._gridColumns) {
                this._gridColumns = [
                    {
                        index: "Avatar",
                        width: 26,
                        canSortBy: false,
                        getCellContents: function (rowInfo, dataIndex, expandedState, level, column, indentIndex, columnOrder) {
                            var grid = this;
                            var item = grid._dataSource[dataIndex];
                            if (item) {
                                var $visitedImageElement = $("<div/>").addClass("visited-image-cell grid-cell");
                                var $imageElement = $("<img/>").attr("src", item.Avatar).appendTo($visitedImageElement);
                                return $visitedImageElement;
                            }
                        }
                    },
                    {
                        index: "Name",
                        text: "Name",
                        width: 200,
                        canSortBy: true
                    },
                    {
                        index: "Email",
                        text: "Email",
                        width: 200,
                        canSortBy: true
                    },
                    {
                        index: "Date",
                        text: "Date",
                        width: 200,
                        canSortBy: true,
                        getColumnValue: function (dataIndex, columnIndex, columnOrder) {
                            var date = visitGridRows[dataIndex].Date;
                            return moment(date).format(Models_1.Constants.FullDateString);
                        }
                    }
                ];
            }
            ;
            return this._gridColumns;
        };
        return RecentlyViewedGrid;
    }(Controls_1.Control));
    exports.RecentlyViewedGrid = RecentlyViewedGrid;
});
