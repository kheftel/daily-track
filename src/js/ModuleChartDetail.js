// CONSTRUCTOR /////////////////////////////////////////////////////////////////

/**
 * Dataset detail view, wraps a ChartJS chart
 * 
 * the parent container can pass data through html5 dataset properties
 * 
 * @param {*} container the html element (or id of an element) that will contain this module
 * @param {ModalControllerDatapointForm} datapointModal 
 * @param {array} ids optional array of dataset ids. if set, will put the chart into multi mode and override data from parent container
 */
var _numControllers = 0;
ModuleChartDetail = function (container, datapointModal, ids = null) {
    if (typeof container == 'string')
        container = document.getElementById(container);

    if (!container)
        throw new Error('chart: container not found');

    // grab data from the container
    this._container = container;
    this._containerData = container.dataset;

    // listen to modal controller events
    if (datapointModal) {
        this._datapointModal = datapointModal;
        this._datapointModal.getView().on('saved', (event, setid, datapoint) => {
            if (!this.datasets) return;
            for (let i = 0; i < this.datasets.length; i++) {
                if (setid == this.datasets[i]._id) {
                    console.log('saved');
                    console.log(datapoint);
                    this.setDatasetPoint(datapoint.x, datapoint, i);
                    this.updateTagCloud();
                    this._chart.update();
                    break;
                }
            }
        });
        this._datapointModal.getView().on('deleted', (event, setid, datapoint) => {
            if (!this.datasets) return;
            for (let i = 0; i < this.datasets.length; i++) {
                if (setid == this.datasets[i]._id) {
                    console.log('deleted');
                    console.log(datapoint);
                    this.deleteDatasetValue(datapoint.x, i);
                    this.updateTagCloud();
                    this._chart.update();
                    break;
                }
            }
        });
    }

    this._focus = moment.utc().startOf('day');

    // create html view
    this._main = elem(
        'div',
        this._container,
        ['card', 'border-light', 'shadow-rb', 'd-flex', 'flex-column', 'flex-expand'],
        ''
    );
    // card header
    this._cardHeader = elem('div', this._main, ['card-header', 'd-flex', 'align-items-center', 'p-1']);
    this._setLabel = elem('h5', this._cardHeader, ['align-middle', 'm-0'], null, this._containerData.setname || '&nbsp;');
    this._btnAddPoint = iconButton(['ml-auto', 'btn-shadow', 'd-none'], this._cardHeader, 'fa-plus', () => {
        if (this._datapointModal)
            this._datapointModal.show(this.datasets[0]);
    });

    // dropdown
    this._drpHeader = elem('div', this._cardHeader, ['dropdown']);
    this._btnDrpShow = elem('button', this._drpHeader, ['btn', 'btn-primary', 'btn-shadow', 'dropdown-toggle', 'd-none']);
    $(this._btnDrpShow)
        .attr('type', 'button')
        .attr('id', 'dropdown' + _numControllers)
        .attr('data-toggle', 'dropdown');
    this._drpHeaderBody = elem('div', this._drpHeader, ['dropdown-menu', 'dropdown-menu-right']);
    this._btnDrpEditSet = iconLink(['d-none', 'dropdown-item'], this._drpHeaderBody, 'fa-edit', 'Edit');
    this._toggleHTML = {
        'bar': '<span class="fas fa-chart-line"></span><span class="ml-2">Switch to line Chart</span>',
        'line': '<span class="fas fa-chart-bar"></span><span class="ml-2">Switch to bar Chart</span>'
    };
    this._btnDrpDeleteSet = iconLink(['d-none', 'dropdown-item'], this._drpHeaderBody, 'fa-trash-alt', 'Delete', '#');

    // card body
    this._cardBody = elem('div', this._main, ['card-body', 'p-1', 'd-flex', 'flex-column', 'flex-expand'], '');
    this._contentContainer = elem('div', this._cardBody, ['d-none', 'p-0', 'text-center', 'flex-expand', 'align-items-center'], 'position: relative; opacity: 0; -webkit-transition: opacity 0.5s; -o-transition: opacity 0.5s; transition: opacity 0.5s;');
    this._spinner = elem('span', this._cardBody, ['spinner-border', 'spinner-border-sm']);
    this._rangeLabel = elem('h6', this._contentContainer, ['align-middle', 'text-center', 'm-0']);

    var chartHeight = 250;

    // chart container, contains only the canvas the chart is rendered on
    this._canvasholder = elem(
        'div',
        this._contentContainer,
        ['w-100'],
        'height: ' + chartHeight + 'px; position: relative;'
    );

    // canvas the chart is rendered on
    this._canvas = elem('canvas', this._canvasholder);

    // zoom buttons below chart
    this._buttonRow = elem('div', this._contentContainer, ['btn-group', 'm-0']);
    this._buttons = {};
    Object.keys(ChartConfig.zoomData).forEach((k) => {
        var data = ChartConfig.zoomData[k];
        var btn = elem('button', this._buttonRow, ['btn', 'btn-primary', 'p-1', 'font-80'], null, data.label);
        btn.id = k;
        this._buttons[k] = btn;
        $(btn).click(() => {
            this.newZoom(k);
        });
    });

    // tag cloud
    this._tagCloudHolder = elem('div',
        this._contentContainer,
        ['bg-gray-900', 'border', 'border-secondary', 'd-flex', 'flex-expand', 'flex-wrap', 'align-items-center', 'align-content-start', 'p-1', 'rounded-2', 'w-100'],
        'position: absolute;height: calc(100% - ' + chartHeight + 'px - 42px - .5rem); bottom: 0; overflow: auto; line-height: 1.2;');
    this._tagCloudHolder.id = 'tag-cloud';

    // color schemes
    this._colorOffset = 0;
    this.defaultColorScheme = 'darkly';
    this._colorScheme = this.defaultColorScheme;

    // create chart
    var config = JSON.parse(JSON.stringify(ModuleChartDetail.defaultConfig));
    config.options.plugins.zoom.pan.onPan = ({
        chart
    }) => {
        this.updateRangeLabel();
    };

    config.options.plugins.zoom.pan.onPanComplete = ({
        chart
    }) => {
        this.updateTagCloud();
    };

    // chart onclick
    config.options.onClick = (e, arr) => {
        console.log(arr);
        if (!Array.isArray(arr) || arr.length == 0 || arr.length > 1) return; // only support single datasets for now

        if (!this._datapointModal) return;

        var p = arr[0];
        if (p == null || p._datasetIndex == null || p._index == null) return;
        var datapoint = this.datasets[p._datasetIndex].data[p._index];

        this._datapointModal.show(this.datasets[p._datasetIndex], datapoint);
    };

    // legend onclick
    config.options.legend.onClick = (e, legendItem) => {
        var index = legendItem.datasetIndex;
        var ci = this._chart;
        var meta = ci.getDatasetMeta(index);

        // See controller.isDatasetVisible comment
        meta.hidden = meta.hidden === null ? !ci.data.datasets[index].hidden : null;

        console.log(meta);

        // We hid a dataset ... rerender the chart
        ci.update();

        // custom addition
        this.updateTagCloud();
    };

    // create chart
    this._chart = new Chart(this._canvas, config);

    // set default zoom level
    this.newZoom('week');

    this._id = _numControllers;
    _numControllers++;

    // extra instance vars
    var chartColors = {
        red: 'rgb(255, 99, 132)',
        orange: 'rgb(255, 159, 64)',
        yellow: 'rgb(255, 205, 86)',
        green: 'rgb(75, 192, 192)',
        blue: 'rgb(54, 162, 235)',
        purple: 'rgb(153, 102, 255)',
        grey: 'rgb(201, 203, 207)'
    };

    this.colorSchemes = {
        vividRainbow: ['#00AAEE', '#A6D608', '#FFE302', '#FF5F00', '#F70D1A', '#9F00FF'],
        darkly: ["#3498DB", "#00bc8c", "#ffef00", /*"#F39C12",*/ "#fd7e14", "#E74C3C", "#e83e8c", "#6f42c1", "#6610f2", "#375a7f"],
        chartjs: [chartColors.red, chartColors.orange, chartColors.yellow, chartColors.green, chartColors.blue, chartColors.purple, chartColors.grey]
    };

    // PROPERTIES //////////////////////////////////////////////////////////////////

    /**
     *  datasets (readonly) 
     **/
    Object.defineProperty(this, 'datasets', {
        get() {
            return this._chart.data.datasets;
        }
    });

    /** color scheme names (readonly) */
    Object.defineProperty(this, 'schemeNames', {
        get() {
            return Object.keys(this.colorSchemes);
        }
    });

    /** get/set color scheme. does NOT update chart, you must do that manually */
    Object.defineProperty(this, 'colorScheme', {
        get() {
            return this._colorScheme;
        },
        set(value) {
            if (this.schemeNames.indexOf(value) == -1)
                throw new Error('schemeName must be one of: ' + this.schemeNames.toString());

            this._colorScheme = value;
            this._colorOffset = 0;
            this.refreshColorsFromScheme();
        }
    });

    /** get/set colorOffset within the color scheme. does NOT update chart, you must do that manually */
    Object.defineProperty(ModuleChartDetail.prototype, 'colorOffset', {
        get() {
            return this._colorOffset;
        },
        set(i) {
            this._colorOffset = i;

            this.refreshColorsFromScheme();
        }
    });

    /** xAxis config object from chart (readonly) */
    Object.defineProperty(ModuleChartDetail.prototype, 'xAxis', {
        get() {
            return this._chart.options.scales.xAxes[0];
        }
    });

    /** xAxisLabel from chart. does NOT update chart, you must do that manually */
    Object.defineProperty(ModuleChartDetail.prototype, 'xAxisLabel', {
        get() {
            return this.xAxis.scaleLabel.labelString;
        },
        set(val) {
            this.xAxis.scaleLabel.labelString = val;
        }
    });

    /** yAxis config object from chart (readonly) */
    Object.defineProperty(ModuleChartDetail.prototype, 'yAxis', {
        get() {
            return this._chart.options.scales.yAxes[0];
        }
    });

    /** yAxisLabel from chart. does NOT update chart, you must do that manually */
    Object.defineProperty(ModuleChartDetail.prototype, 'yAxisLabel', {
        get() {
            return this.yAxis.scaleLabel.labelString;
        },
        set(val) {
            this.yAxis.scaleLabel.labelString = val;
        }
    });

    /** 
     * current timeScale object for this zoom level (readonly) 
     */
    // Object.defineProperty(ModuleChartDetail.prototype, 'timeScale', {
    //     get() {
    //         return this.timeScales[this._zoomLevel];
    //     }
    // });

    var complete = function () {
        console.log(this);
        // update chart
        this._chart.update();
        this.updateTagCloud();

        // fade in the main content container
        $(this._contentContainer).removeClass('d-none');
        this._contentContainer.style.opacity = 1;
        $(this._spinner).addClass('d-none');
    }.bind(this);

    // load dataset(s)
    if (ids && Array.isArray(ids)) {
        this.addDatasetsFromIds(ids, complete);
    } else if (this._containerData.setid) {
        this.addDataset(this._containerData.setid, complete);
    }
};

// INSTANCE METHODS ////////////////////////////////////////////////////////////

/**
 * zoom to a particular zoom level, defined in ChartConfig
 * 
 * @param {string} level week, month, 3month, 6month, or year
 */
function newZoom(level) {

    var data = ChartConfig.zoomData[level];

    this._chart.options.scales.xAxes[0].time.unit = data.unit;
    this._chart.options.scales.xAxes[0].time.min = moment(ChartConfig.today).add(data.viewport).format('YYYY-MM-DD');
    this._chart.options.scales.xAxes[0].time.max = ChartConfig.today.format('YYYY-MM-DD');
    this._chart.data.labels = data.labels;

    this._chart.update();

    this.updateRangeLabel();
    this.updateTagCloud();
}
ModuleChartDetail.prototype.newZoom = newZoom;

/**
 * update the range label at the top of the chart display
 */
function updateRangeLabel() {
    this._rangeLabel.innerHTML = this.getRangeString();
}
ModuleChartDetail.prototype.updateRangeLabel = updateRangeLabel;

// function showmodal(message) {
//     var modal = elem('div', body, ['modal', 'fade']);

//     modal.innerHTML =
//         `<div class="modal fade" id="exampleModal" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
//       <div class="modal-dialog" role="document">
//         <div class="modal-content">
//           <div class="modal-header">
//             <h5 class="modal-title" id="exampleModalLabel">Modal title</h5>
//             <button type="button" class="close" data-dismiss="modal" aria-label="Close">
//               <span aria-hidden="true">&times;</span>
//             </button>
//           </div>
//           <div class="modal-body">
//             ${message}
//           </div>
//           <div class="modal-footer">
//             <button type="button" class="btn btn-secondary" data-dismiss="modal">No</button>
//             <button type="button" class="btn btn-primary">Yes</button>
//           </div>
//         </div>
//       </div>
//     </div>`;

//     $(modal).show();
// }

/**
 * add a dataset to the chart, it will populate itself via AJAX
 * 
 * @param  {} id
 * @param  {} complete
 */
function addDataset(id, complete) {
    $.ajax({
        url: '/api/sets/' + id,
        method: 'GET',
        success: (dataset) => {
            this.addDatasetFromModel(dataset, complete);
        },
        error: (err) => {
            console.log(err);

            if (complete) complete();
        }
    });
}
ModuleChartDetail.prototype.addDataset = addDataset;

/**
 * add several datsets at once
 * 
 * @param  {} ids array of dataset ids
 * @param  {} complete oncomplete function
 */
function addDatasetsFromIds(ids, complete) {
    var which = 0;
    var datasets = [];

    function load(id) {
        console.log('loading set ' + id);
        $.ajax({
            url: '/api/sets/' + id,
            method: 'GET',
            success: (dataset) => {
                datasets.push(dataset);
                next();
            },
            error: (err) => {
                console.log(err);
                next();
            }
        });
    }

    var next = function () {
        console.log(which + '/' + ids.length);
        if (which < ids.length) {
            load(ids[which]);
            which++;
        } else if (which == ids.length) {
            // all done
            datasets.forEach((set, i) => {
                console.log('adding set ' + i + ', id=' + set._id);
                this.addDatasetFromModel(set);
            });

            if (complete) complete();
        }
    }.bind(this);

    next();
}
ModuleChartDetail.prototype.addDatasetsFromIds = addDatasetsFromIds;

/**
 * add a dataset from the complete data
 * 
 * @param  {} dataset
 * @param  {} complete
 */
function addDatasetFromModel(dataset, complete) {
    // translate for chart dataset object
    dataset.type = dataset.chartType;
    dataset.label = dataset.name;
    if (this.datasets >= 1) dataset.label += ' (' + dataset.yAxisLabel + ')';
    dataset.data = dataset.data;
    dataset.fill = false;
    dataset.pointBackgroundColor = this.getColor(this.datasets.length);
    dataset.pointBorderColor = this.getColor(this.datasets.length);
    dataset.borderColor = this.getColor(this.datasets.length);
    dataset.backgroundColor = Chart.helpers.color(this.getColor(this.datasets.length)).alpha(0.6).rgbString();

    // don't trigger a chart update yet
    // TO DO: what if different charts have different y axis labels?
    this.xAxis.scaleLabel.labelString = dataset.xAxisLabel;
    this.yAxis.scaleLabel.labelString = dataset.yAxisLabel;

    this.datasets.push(dataset);
    if (!this._datasetIds)
        this._datasetIds = [];
    this._datasetIds.push(dataset._id);

    // set up single mode or multi mode
    if (this.datasets.length > 1) {
        // remove unit from header text
        $(this._setLabel).html(dataset.yAxisLabel);

        // hide dropdown
        $(this._btnDrpShow).addClass('d-none');

        // hide all dropdown buttons
        // $(this._btnDrpChartType).addClass('d-none');
        $(this._btnDrpDeleteSet).addClass('d-none');
        $(this._btnDrpEditSet).addClass('d-none');

        // hide header add point butn
        $(this._btnAddPoint).addClass('d-none');

        // hide old footer row 2
        // $(this._ftrRow2).removeClass('d-flex').addClass('d-none'); // footer row 2

        // turn on legend display
        this._chart.options.legend.display = true;
    } else {
        // add unit to header text
        $(this._setLabel).html(dataset.name + ' (' + dataset.yAxisLabel + ')');

        // show dropdown
        $(this._btnDrpShow).removeClass('d-none');

        // show some dropdown buttons
        $(this._btnAddPoint).removeClass('d-none');
        $(this._btnDrpEditSet).removeClass('d-none').attr('href', '/set/' + dataset._id + '/edit');

        // show and activate delete dataset button
        $(this._btnDrpDeleteSet).removeClass('d-none').confirmation({
            rootSelector: this._btnDrpDeleteSet,
            popout: true,
            container: 'body',
            title: 'Are you sure you want to delete ' + dataset.name + '?'
        }).on('click', (e) => {
            if (this.datasets.length != 1) throw new Error('cannot delete if empty or in multi-mode');

            e.preventDefault();

            // delete set from database
            $.ajax({
                    url: '/api/sets/' + dataset._id,
                    method: 'POST',
                    data: {
                        name: dataset.name,
                        yAxisLabel: dataset.yAxisLabel,
                        delete: '1'
                    },
                    dataType: 'json',
                    encode: true
                })
                .done((data) => {
                    console.log('ajax resopnse:');
                    console.log(data);

                    // enable btn
                    $(this._btnDrpDeleteSet).prop('disabled', false);

                    if (!data.success) {
                        // error in deletion
                        if (data.errors) {
                            data.errors.forEach((error) => {
                                // add the error message

                                $.toast({
                                    title: 'Error',
                                    content: error.msg,
                                    type: 'error',
                                    delay: 5000
                                });
                            });
                        }
                    } else {
                        $(this._main)
                            .removeClass('anim-disappear')
                            .addClass('anim-disappear')
                            .on('animationend webkitanimationEnd', (e) => {
                                // destroy chart and html
                                this._chart.destroy();
                                this._chart = null;
                                this._main.remove();

                                $.toast({
                                    title: 'Success!',
                                    content: data.message,
                                    type: 'success',
                                    delay: 5000
                                });

                                // if we were on the set detail page, we should go somewhere else
                                if (window.location.pathname != '/')
                                    window.location.href = '/';
                            });
                    }
                })
                .fail((data) => {
                    // enable btn
                    $(this._btnDrpDeleteSet).prop('disabled', false);

                    $.toast({
                        title: 'Error!',
                        content: 'Unable to delete, please try again later',
                        type: 'error',
                        delay: 5000
                    });
                    console.log('ajax error:');
                    console.log(data);
                });
        });
    }

    console.log('dataset added:');
    console.log(dataset);

    // console.log('scaleservice time defaults:');
    // console.log(Chart.scaleService.defaults.time);

    if (complete) complete();
}
ModuleChartDetail.prototype.addDatasetFromModel = addDatasetFromModel;

/**
 * apply color scheme to chart options.
 */
function refreshColorsFromScheme() {
    for (var i = 0; i < this.datasets.length; i++) {
        var set = this.datasets[i];
        set.pointBackgroundColor = this.getColor(i);
        set.pointBorderColor = this.getColor(i);
        set.borderColor = this.getColor(i);
    }
}
ModuleChartDetail.prototype.refreshColorsFromScheme = refreshColorsFromScheme;

/**
 * grab a color from the colorscheme
 * 
 * @param  {} i=0
 */
function getColor(i = 0) {
    var scheme = this.colorSchemes[this._colorScheme];
    return scheme[(i + this._colorOffset) % scheme.length];
}
ModuleChartDetail.prototype.getColor = getColor;

/**
 * labeling string representing the range of the chart
 * 
 * @param {*} scaleid which scale to use, defaults to the first horizontal one
 */
function getRangeString(scaleid = 'x-axis-0') {
    var min = moment(this._chart.scales[scaleid].min);
    var max = moment(this._chart.scales[scaleid].max);
    var minYear = min.format('YYYY');
    var maxYear = max.format('YYYY');
    var minMonth = min.format('MMM');
    var maxMonth = max.format('MMM');
    var minDay = min.format('D');
    var maxDay = max.format('D');
    var rangeString;
    if (minYear != maxYear) {
        // years differ
        rangeString = minMonth + ' ' + minYear + ' - ' + maxMonth + ' ' + maxYear;
    } else if (minMonth != maxMonth) {
        // years are same and months differ
        rangeString = minMonth + ' ' + minDay + ' - ' + maxMonth + ' ' + maxDay + ', ' + minYear;
    } else if (minDay != maxDay) {
        // years/months are same and days differ
        rangeString = minMonth + ' ' + minDay + ' - ' + maxDay + ', ' + minYear;
    }
    return rangeString;
}
ModuleChartDetail.prototype.getRangeString = getRangeString;

/**
 * get dataset value at date x
 * 
 * @param  {} x date in 'YYYY-MM-DD' format
 */
function getDatasetValue(x, setIndex) {
    var data = this.datasets[setIndex].data;
    for (var i = 0; i < data.length; i++) {
        if (data[i].x == x) {
            return data[i].y;
        }
    }
    return "0";
}
ModuleChartDetail.prototype.getDatasetValue = getDatasetValue;

/**
 * get whether dataset value at date x exists
 * 
 * @param  {} x date in 'YYYY-MM-DD' format
 */
function getDatasetValueExists(x, setIndex = 0) {
    var data = this.datasets[setIndex].data;
    for (var i = 0; i < data.length; i++) {
        if (data[i].x == x) {
            return true;
        }
    }
    return false;
}
ModuleChartDetail.prototype.getDatasetValueExists = getDatasetValueExists;

/**
 * set dataset value at date x. does NOT update chart
 * 
 * @param  {} x date in 'YYYY-MM-DD' format
 * @param  {} y value
 */
function setDatasetValue(x, y, setIndex = 0) {
    var data = this.datasets[setIndex].data;

    var newPoint = {
        x: x,
        y: y
    };

    for (var i = 0; i < data.length; i++) {
        // is it equal to this date?
        if (data[i].x == x) {
            // update existing value
            data[i].y = y;
            return;
        }

        // is it before this one?
        if (moment(x).isBefore(moment(data[i].x))) {
            if (i == 0)
                data.unshift(newPoint);
            else
                data.splice(i, 0, newPoint);
            return;
        }
    }

    // is data off the end? add at end
    data.push(newPoint);
}
ModuleChartDetail.prototype.setDatasetValue = setDatasetValue;

/**
 * set datapoint at date x. does NOT update chart
 * 
 * @param  {} x date in 'YYYY-MM-DD' format
 * @param  {} datapoint point
 * @param  {} setIndex which dataset
 */
function setDatasetPoint(x, datapoint, setIndex = 0) {
    var data = this.datasets[setIndex].data;

    for (var i = 0; i < data.length; i++) {
        // is it equal to this date?
        if (data[i].x == datapoint.x) {
            // update existing value
            data[i] = datapoint;
            return;
        }

        // is it before this one?
        if (moment(datapoint.x).isBefore(moment(data[i].x))) {
            if (i == 0)
                data.unshift(datapoint);
            else
                data.splice(i, 0, datapoint);
            return;
        }
    }

    // is data off the end? add at end
    data.push(datapoint);
}
ModuleChartDetail.prototype.setDatasetPoint = setDatasetPoint;

/**
 * get a new array of all the datapoints between two dates, inclusive
 * 
 * @param {string} start 'YYYY-MM-DD' format
 * @param {string} end 'YYYY-MM-DD' format
 * @param {number} setIndex which dataset
 */
function getRange(start, end, setIndex = 0) {
    let retval = [];
    if (this.datasets.length <= setIndex) return retval;

    var data = this.datasets[setIndex].data;

    let mStart = moment(start);
    let mEnd = moment(end);

    for (let i = 0; i < data.length; i++) {
        let mDate = moment(data[i].x);
        if (mStart.isSameOrBefore(mDate) &&
            mEnd.isSameOrAfter(mDate)) {
            retval.push(data[i]);
        }
    }
    return retval;
}
ModuleChartDetail.prototype.getRange = getRange;

/**
 * get tag cloud data for a particular dataset
 * 
 * @param {*} start 
 * @param {*} end 
 * @param {*} setIndex 
 */
function getTagCloud(start, end, setIndex = 0) {
    let data = this.getRange(start, end, setIndex);
    let retval = {};

    let meta = this.getDatasetMeta(setIndex);
    if (meta.hidden) {
        // dataset is hidden, bail!
        return retval;
    }

    for (let i in data) {
        let tags = data[i].tags;
        if (tags && Array.isArray(tags)) {
            for (let j in tags) {
                let tag = tags[j];

                let existing = retval[tag];
                if (!existing) {
                    retval[tag] = {
                        number: 1,
                        // color: this.getColor(setIndex)
                    };
                } else {
                    retval[tag].number++;
                }
            }
        }
    }
    return retval;
}
ModuleChartDetail.prototype.getTagCloud = getTagCloud;

/**
 * update the module's tag cloud view
 */
function updateTagCloud() {
    if (!this.datasets) return;

    let min = this._chart.options.scales.xAxes[0].time.min;
    let max = this._chart.options.scales.xAxes[0].time.max;
    let output = '';
    this.datasets.forEach((dataset, i) => {
        let tagData = this.getTagCloud(min, max, i);
        let color = this.getColor(i);
        // console.log(i, this.getColor(i));
        for (let key in tagData) {
            let tag = tagData[key];
            let textsize = (1 + (tag.number - 1) * 0.5) + 'rem';
            output += `<span class="mx-1" style="color: ${color}; font-size: ${textsize}">${key}</span>`;
        }
    });

    this._tagCloudHolder.innerHTML = output;
}
ModuleChartDetail.prototype.updateTagCloud = updateTagCloud;

/**
 * grab the ChartJS-exposed metadata for a dataset
 * 
 * @param {*} setIndex 
 */
function getDatasetMeta(setIndex) {
    var ci = this._chart;
    var meta = ci.getDatasetMeta(setIndex);
    return meta;
}
ModuleChartDetail.prototype.getDatasetMeta = getDatasetMeta;

/**
 * delete dataset value at date x. does NOT update chart
 * 
 * @param  {} x date in 'YYYY-MM-DD' format
 */
function deleteDatasetValue(x, setIndex = 0) {
    var data = this.datasets[setIndex].data;

    for (var i = 0; i < data.length; i++) {
        // is it equal to this date?
        if (data[i].x == x) {
            // delete existing value
            data.splice(i, 1);
            return;
        }
    }
}
ModuleChartDetail.prototype.deleteDatasetValue = deleteDatasetValue;

// STATIC VARIABLES ////////////////////////////////////////////////////////////
ModuleChartDetail.defaultButtonClasses = ['btn', 'btn-primary'];

ModuleChartDetail.defaultConfig = {
    type: "line",
    options: {
        legend: {
            display: false
        },
        scales: {
            xAxes: [{
                type: 'time',
            }],
            yAxes: [{}]
        },
        tooltips: {
            mode: 'nearest',
            intersect: true,
        },
        hover: {
            mode: 'nearest',
            intersect: true
        },
        plugins: {
            zoom: {
                pan: {
                    enabled: true,
                    mode: 'x',
                    speed: 1,
                    threshold: 1
                },
                zoom: {
                    enabled: false,
                    mode: 'y'
                }
            }
        }
    }
};

// convenience functions ///////////////////////////////////////////////////////

/**
 * create an html element
 * 
 * @param  {} type required, which element to create
 * @param  {} parent optional, where to attach in DOM
 * @param  {} classList optional, array of classes to add (or one single class as a string)
 * @param  {} style optional, inline css to add
 * @param  {} innerHTML optional, innerHTML to add
 */
function elem(type, parent, classList, style, innerHTML) {
    var result = document.createElement(type);
    if (classList) {
        result.classList.add.apply(result.classList, Array.isArray(classList) ? classList : [classList]);
    }
    if (style) {
        result.style = style;
    }
    if (innerHTML) {
        result.innerHTML = innerHTML;
    }
    if (parent) {
        parent.appendChild(result);
    }
    return result;
}
/**
 * create a button with an icon
 * 
 * @param  {Array} classList
 * @param  {} parent
 * @param  {} icon
 * @param  {} click
 * @param  {} style
 */
function iconButton(classList, parent, icon, click, style) {
    var result = elem('button', parent, ModuleChartDetail.defaultButtonClasses.concat(classList), style, `<span class="fas ${icon}"></i>`);
    if (click)
        $(result).click(click);
    return result;
}

/**
 * create a link with an icon and text
 * @param {*} classList 
 * @param {*} parent 
 * @param {*} icon 
 * @param {*} text 
 * @param {*} href 
 * @param {*} click 
 * @param {*} style 
 */
function iconLink(classList, parent, icon, text, href, click, style) {
    var result = elem('a', parent, classList, style, `<span class="fas ${icon}"></span><span class="ml-2">${text}</span>`);
    if (href)
        result.href = href;
    if (click)
        $(result).click(click);
    return result;
}

module.exports = ModuleChartDetail;