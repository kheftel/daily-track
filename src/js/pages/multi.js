import '../../base.js';
import '../../charting.js';

import $ from 'jquery';
import ModalControllerDatapointForm from '../ModalControllerDatapointForm';
import ModuleChartDetail from '../ModuleChartDetail';

var controller = new ModalControllerDatapointForm();

var container = $('#multi')[0];
if(container) {
    var ids = JSON.parse(container.dataset.ids);
    console.log(ids);

    var module = new ModuleChartDetail(container, controller, ids);
}
