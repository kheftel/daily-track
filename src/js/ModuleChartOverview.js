import moment from 'moment';
// const ModalControllerDatapointForm = require('./ModalControllerDatapointForm');
import ModalControllerDatapointForm from './ModalControllerDatapointForm';

/**
 * overview chart module
 * 
 * @param {*} container the html element (or id of an element) that will contain this module
 * @param {ModalControllerDatapointForm} datapointModal 
 */

var ModuleChartOverview = function (container, datapointModal) {
    // parent container can be id or html elem
    if (typeof container == 'string')
        container = document.getElementById(container);
    if (!container)
        throw new Error('ModuleChartOverview: container not found');

    // grab data from the container
    this._container = container;
    this._containerData = container.dataset;
    var setid = this._containerData.setid;
    var setname = this._containerData.setname;

    this._datapointModal = datapointModal;
    this._datapointModal.getView().on('saved', (event, id, datapoint) => {
        if (!this._dataset) return;
        console.log(id + ' vs ' + this._dataset._id);
        if (id == this._dataset._id) {
            console.log('refresh');
            this.refresh();
        }
    });
    this._datapointModal.getView().on('deleted', (event, id, datapoint) => {
        if (!this._dataset) return;
        console.log(id + ' vs ' + this._dataset._id);
        if (id == this._dataset._id) {
            console.log('refresh');
            this.refresh();
        }
    });

    // create html
    // .card.border-light.shadow-rb(style="height: " + style.chartRowHeight)
    //     .card-header.p-2
    //         .card-title.m-0.d-flex.content-justify-between
    //             h4.m-0.text-shadow
    //                 a.align-middle(href="/set/" + set._id)= set.name
    //             button.ml-auto.btn.btn-primary.btn-shadow
    //                 span.fas.fa-edit
    //     .card-body(style="position: relative;")
    //         .chartcontainer(id="set-" + i + "-" + set._id data-setid=set._id)
    this._main = elem(
        'div',
        this._container,
        ['card', 'border-light', 'shadow-rb', 'w-100', 'h-100'],
        ''
    );
    this._cardHeader = elem('div', this._main, ['card-header', 'navbar', 'p-1']);
    this._detailLink = elem('a', this._cardHeader, ['text-white', 'align-middle', 'm-0'], null, setid ? setname : 'Create Dataset');
    this._detailLink.href = setid ? '/set/' + setid : '/set/new';

    // streak
    this._streak = elem('div', this._cardHeader, ['ml-auto', 'mr-1']);

    // dropdown
    // this._drpHeader = elem('div', this._cardHeader, ['dropdown', 'ml-auto']);
    // this._drpHeaderBtn = elem('button', this._drpHeader, ['btn', 'btn-primary', 'btn-shadow', 'dropdown-toggle']);
    // $(this._drpHeaderBtn).addClass('d-none');
    // $(this._drpHeaderBtn)
    //     .attr('type', 'button')
    //     .attr('data-toggle', 'dropdown');
    // this._drpHeaderBody = elem('div', this._drpHeader, ['dropdown-menu', 'dropdown-menu-right']);

    // edit item in dropdown
    // this._editButton = iconLink(['d-none', 'dropdown-item'], this._drpHeaderBody, 'fa-edit', 'Edit');

    // three visual states: showing _cntent, _spinner, or _createSet

    // content
    this._cardBody = elem('div', this._main, ['card-body', 'p-1']);
    this._content = elem('div', this._cardBody, ['d-none', 'container', 'p-0']);

    // loading spinner
    this._spinner = elem('span', this._cardBody, ['spinner-border', 'spinner-border-sm', 'd-none']);

    // button to create new dataset
    this._createSet = largeIconButton(['w-100', 'h-100'], this._cardBody, 'fa-plus-square fa-3x', 'Create Dataset', () => {
        window.location.href = '/set/new';
    }, '');

    var row1 = elem('div', this._content, ['row', 'm-0']);
    var col12 = elem('div', row1, ['col-12', 'p-0']);

    // last tracked values etc
    this._stats = elem('div', col12, ['text-dark', 'm-0', 'font-90'], '', '');

    var row2 = elem('div', this._content, ['row', 'm-0']);
    var col1 = elem('div', row2, ['col-6', 'p-1']);

    // track button
    this._btnTrack = largeIconButton(['w-100'], col1, 'fa-plus-square fa-2x', 'Track', () => {
        this._datapointModal.show(this._dataset);
    }, '');

    var col2 = elem('div', row2, ['col-6', 'p-1']);
    // details button
    this._btnDetails = largeIconButton(['w-100'], col2, 'fa-chart-line fa-2x', 'Details', () => {
        window.location.href = this._detailLink.href;
    }, '');

    // set dataset
    if (setid)
        this.setDataset(setid);
    else
        this.setVisualState(this._createSet);
};
var p = ModuleChartOverview.prototype;

// some defaults
p.dateFormat = 'MM/DD/YYYY';

p.defaultZoomLevel = 6;

p.defaultButtonClasses = ['btn', 'btn-primary', 'text-dark', 'btn-shadow'];

p.defaultFocusStyle = {
    borderColor: '#00bc8c', //'#375a7f',
    borderWidth: 3
};

p.setVisualState = function (state) {
    this._state = state;

    $(this._spinner).addClass('d-none');
    $(this._content).addClass('d-none');
    $(this._createSet).addClass('d-none');

    $(state).removeClass('d-none');

    // $(this._drpHeader).removeClass('d-none');
    // if (state == this._createSet)
    // $(this._drpHeader).addClass('d-none');
};

// convenience functions ////////////////////////

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
 * create a large button with an icon
 * 
 * @param  {Array} classList
 * @param  {} parent
 * @param  {} icon
 * @param  {} caption
 * @param  {} click
 * @param  {} style
 */
function largeIconButton(classList, parent, icon, caption, click, style) {
    var result = elem('button', parent, p.defaultButtonClasses.concat(classList), style, `<span class="fas ${icon}"></span><br /><span class="font-80">${caption}</span>`);
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
 * refresh module's content
 */
p.refresh = function () {
    if (!this._dataset) return;
    this.setDataset(this._dataset._id);
};

/**
 * set the module's dataset, it will populate itself via AJAX
 * 
 * @param  {} id
 * @param  {} complete
 */
p.setDataset = function (id, complete) {
    this.setVisualState(this._spinner);
    $.ajax({
        url: '/api/sets/' + id,
        method: 'GET',
        success: (data) => {
            if (!data.success) {
                $.toast({
                    title: 'Error',
                    content: data.message || (data.error && data.error.message) || 'Unable to load, try again later',
                    type: 'error',
                    delay: 5000
                });
                this.setVisualState(this._content);
                this._content.innerHTML = 'loading error';
            }
            else {
                this.setVisualState(this._content);
                this.setDatasetFromModel(data.data, complete);
            }
        },
        error: (err) => {
            this.setVisualState(this._content);
            this._content.innerHTML = 'loading error';

            console.log(err);

            if (complete) complete();
        }
    });
};

/**
 * set the module's dataset from the complete data
 * 
 * @param  {} dataset
 * @param  {} complete
 */
p.setDatasetFromModel = function (dataset, complete) {
    this._dataset = dataset;

    // console.log(dataset);

    // show / activate edit button
    $(this._editButton).removeClass('d-none').attr('href', '/set/' + dataset._id + '/edit');

    // populate stats content
    this.updateStats();

    if (complete) complete();
};

p.updateStats = function () {
    var numPoints = this._dataset.data.length;
    var unit = this._dataset.yAxisLabel;
    var trackedClass = 'text-dark';
    var tracked, value, streak = 0, streakEmoji, streaklabel;

    if (numPoints > 0) {
        var mToday = moment().startOf('day');
        var oLastPoint = this._dataset.data[numPoints - 1];
        var mLastPoint = moment(oLastPoint.x);
        var days = mLastPoint.diff(mToday, 'day');

        // streak
        // if last point is today, add one to streak
        if (mLastPoint.format('YYYY-MM-DD') == mToday.format('YYYY-MM-DD'))
            streak = 1;
        // add one streak for yesterday and every consecutive day before that with a tracked value
        var streakCounter = moment(mToday).add({ day: -1 });
        var matchStreakCounter = point => point != null && point.y != null && point.x == streakCounter.format('YYYY-MM-DD');
        while (true) {
            var found = this._dataset.data.find(matchStreakCounter);
            if (found) {
                streak++;
                streakCounter.add({ days: -1 });
            }
            else
                break;
        }
        // '😘''😗''😄''😙''😚'
        var level0 = ['😭', '🙃', '😱', '😬', '🤪', '🤨', '🤭', '😐', '😑', '🥺'];
        var level1 = ['🙂'];
        var level2 = ['😊', '😏'];
        var level3 = ['😇', '😍'];
        var level4 = ['🤗', '🥰'];
        var level5 = ['😋', '😁'];
        var level6 = ['😎'];
        var level7 = ['🤠'];
        var level8 = ['😻'];
        var level9 = ['🤑'];
        var level10 = ['🤩'];
        var level11 = ['🥳'];
        var level12 = ['👽'];
        if (streak == 0)
            streakEmoji = level0;
        else if (streak < 2)
            streakEmoji = level1;
        else if (streak < 4)
            streakEmoji = level2;
        else if (streak < 6)
            streakEmoji = level3;
        else if (streak < 8)
            streakEmoji = level4;
        else if (streak < 10)
            streakEmoji = level5;
        else if (streak < 13)
            streakEmoji = level6;
        else if (streak < 16)
            streakEmoji = level7;
        else if (streak < 20)
            streakEmoji = level8;
        else if (streak < 23)
            streakEmoji = level9;
        else if (streak < 26)
            streakEmoji = level10;
        else if (streak < 30)
            streakEmoji = level11;
        else
            streakEmoji = level12;
        streakEmoji = streakEmoji[Math.floor(streakEmoji.length * Math.random())];
        // console.log(streakEmoji);
        // if(window.twemoji)
        // {
        //     streakEmoji = window.twemoji.parse(streakEmoji);
        //     console.log(streakEmoji);
        // }
        streaklabel = `${streak}&nbsp;${streakEmoji}`;

        // days ago
        if (days == 0)
            tracked = 'today';
        else if (days == -1)
            tracked = 'yesterday';
        else
            tracked = mLastPoint.from(mToday);

        // style
        // console.log(days);
        if (days == 0)
            trackedClass = 'text-success';
        // else if(days >= -1)
        //     trackedClass = 'text-dark';
        else if (days >= -3)
            trackedClass = 'text-warning';
        else
            trackedClass = 'text-danger';

        // value
        // value = `${oLastPoint.y} (${unit})`;
        value = `${oLastPoint.y}`;
    }
    else {
        tracked = 'never tracked';
        value = 'N/A';
        streaklabel = '';
    }

    var sTimes = numPoints == 1 ? 'time' : 'times';

    var outputs = [
        `Last: ${value} (<span class="${trackedClass}">${tracked}</span>)`,
        `Streak: ${streak}`,
        `Tracked ${numPoints} ${sTimes}`,
    ];
    this._stats.innerHTML = outputs.join('<br />');

    this._streak.innerHTML = streaklabel;

    this._detailLink.innerHTML = this._dataset.name; //`${this._dataset.name} (${unit})`;
};

// module.exports = ModuleChartOverview;
export default ModuleChartOverview;