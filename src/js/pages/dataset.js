import '../../base.js';
import '../../charting.js';

import $ from 'jquery';
import ModalControllerDatapointForm from '../ModalControllerDatapointForm';
import ModuleChartDetail from '../ModuleChartDetail';

var controller = new ModalControllerDatapointForm();
var detailModule = new ModuleChartDetail($(".module-chart-detail")[0], controller);
