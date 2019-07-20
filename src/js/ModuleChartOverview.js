/**
 * overview chart module
 * 
 * @param  {} container the html element where we put our markup
 */

const moment = require('moment');

ModuleChartOverview = function (container) {
    // parent container can be id or html elem
    if (typeof container == 'string')
        container = document.getElementById(container);

    if (!container)
        throw new Error('ModuleChartOverview: container not found');

    this._parentContainer = container;
    var parentData = container.dataset;

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
        this._parentContainer,
        ['card', 'border-light', 'shadow-rb']
    );
    this._cardHeader = elem('div', this._main, ['card-header', 'd-flex', 'align-items-center', 'p-2']);
    this._detailLink = elem('a', this._cardHeader, ['align-middle', 'm-0', 'h5'], null, parentData.setname);
    this._detailLink.href = '/set/' + parentData.setid;

    // dropdown
    this._drpHeader = elem('div', this._cardHeader, ['dropdown', 'ml-auto']);
    this._drpHeaderBtn = elem('button', this._drpHeader, ['btn', 'btn-outline-success', 'dropdown-toggle']);
    $(this._drpHeaderBtn)
        .attr('type', 'button')
        .attr('data-toggle', 'dropdown');
    this._drpHeaderBody = elem('div', this._drpHeader, ['dropdown-menu', 'dropdown-menu-right']);
    /* <div class="dropdown">
      <button class="btn btn-secondary dropdown-toggle" type="button" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
        Dropdown button
      </button>
      <div class="dropdown-menu" aria-labelledby="dropdownMenuButton">
        <a class="dropdown-item" href="#">Action</a>
        <a class="dropdown-item" href="#">Another action</a>
        <a class="dropdown-item" href="#">Something else here</a>
      </div>
    </div> */

    // edit item in dropdown
    this._editButton = iconLink(['d-none', 'dropdown-item'], this._drpHeaderBody, 'fa-edit', 'Edit');

    // content
    this._cardBody = elem('div', this._main, ['card-body', 'p-2']);
    this._content = elem('div', this._cardBody, ['d-none', 'container', 'p-0']);

    // loading spinner
    this._spinner = elem('span', this._cardBody, ['spinner-border', 'spinner-border-sm', 'd-none']);

    var row1 = elem('div', this._content, ['row', 'm-0']);
    var col12 = elem('div', row1, ['col-12', 'p-0']);

    // last tracked values
    this._lastTracked = elem('p', col12, ['m-0', 'd-none'], 'font-size: 90%;', '');

    var row2 = elem('div', this._content, ['row', 'm-0'], 'font-align: center');
    var col1 = elem('div', row2, ['col-6', 'p-1']);
    // track button
    this._btnTrack = largeIconButton([], col1, 'fa-plus-square fa-2x', 'Track', () => {
        
    }, 'width:100%');
    var col2 = elem('div', row2, ['col-6', 'p-1']);
    // details button
    this._btnDetails = largeIconButton([], col2, 'fa-chart-line fa-2x', 'Details', () => {
        
    }, 'width:100%');
};
var p = ModuleChartOverview.prototype;

// some defaults
p.dateFormat = 'MM/DD/YYYY';

p.defaultZoomLevel = 6;

p.defaultButtonClasses = ['btn', 'btn-outline-success'];

p.defaultFocusStyle = {
    borderColor: '#00bc8c', //'#375a7f',
    borderWidth: 3
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
    var result = elem('button', parent, p.defaultButtonClasses.concat(classList), style, `<span class="fas ${icon}"></span><br /><span style="font-size: 80%;">${caption}</span>`);
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
 * set the module's dataset, it will populate itself via AJAX
 * 
 * @param  {} id
 * @param  {} complete
 */
p.setDataset = function (id, complete) {
    $(this._spinner).removeClass('d-none');
    $.ajax({
        url: '/api/sets/' + id,
        method: 'GET',
        success: (dataset) => {
            $(this._spinner).addClass('d-none');
            $(this._content).removeClass('d-none');
            
            this.setDatasetFromModel(dataset, complete);
        },
        error: (err) => {
            $(this._spinner).addClass('d-none');
            $(this._content).removeClass('d-none');
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

    console.log(dataset);

    // show / activate edit button
    $(this._editButton).removeClass('d-none').attr('href', '/set/' + dataset._id + '/edit');

    // populate content
    this.updateLastTracked();
    
    if (complete) complete();
};

p.updateLastTracked = function() {
    var numPoints = this._dataset.data.length;
    var tracked = '';
    var value = 'Value: ';
    if(numPoints > 0)
    {
        var lastPoint = this._dataset.data[numPoints - 1];
        tracked += moment(lastPoint.x).fromNow();
        value += lastPoint.y;
    }
    else
    {
        tracked += 'never';
        value += 'N/A';
    }
    $(this._lastTracked).removeClass('d-none');
    this._lastTracked.innerHTML = tracked + '<br />' + value;
};

module.exports = ModuleChartOverview;