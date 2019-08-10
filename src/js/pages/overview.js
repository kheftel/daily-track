import $ from 'jquery';
import ModalControllerDatapointForm from '../ModalControllerDatapointForm';
import ModuleChartOverview from '../ModuleChartOverview';
import '../../base.js';

var controller = new ModalControllerDatapointForm();

$('.module-chart-overview').each(function(i, container) {
    var module = new ModuleChartOverview(container, controller);
    //- controller.colorOffset = i;
});