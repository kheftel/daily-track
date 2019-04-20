(function (Chart) {
    var VHLinePlugin = {
        beforeDraw: function (chart) {
            var ctx = chart.chart.ctx;
            var axis, line, borderWidth, borderColor, fontColor, fontFamily, fontSize, value, i;

            var hLines = chart.options.horizontalLine;
            if (hLines) {
                axis = chart.scales["y-axis-0"];
                for (i = 0; i < hLines.length; i++) {
                    line = hLines[i];

                    borderWidth = line.borderWidth || VHLinePlugin.defaults.borderWidth;
                    borderColor = line.borderColor || VHLinePlugin.defaults.borderColor;
                    value = line.y ? axis.getPixelForValue(line.y) : 0;
                    fontColor = line.fontColor || Chart.defaults.global.defaultFontColor;
                    fontFamily = line.fontFamily || Chart.defaults.global.defaultFontFamily;
                    fontSize = line.fontSize || Chart.defaults.global.defaultFontSize;

                    if (value) {
                        VHLinePlugin.drawLine(ctx, borderWidth, borderColor, chart.chartArea.left, value, chart.chartArea.right, value);
                    }

                    if (line.text) {
                        ctx.fillStyle = fontColor;
                        ctx.font = fontSize + 'px ' + fontFamily;
                        ctx.fillText(line.text, chart.chartArea.left, value - fontSize / 2);
                    }
                }
            }
            vLines = chart.options.verticalLine;
            if (vLines) {
                axis = chart.scales["x-axis-0"];
                for (i = 0; i < vLines.length; i++) {
                    line = vLines[i];

                    borderWidth = line.borderWidth || VHLinePlugin.defaults.borderWidth;
                    borderColor = line.borderColor || VHLinePlugin.defaults.borderColor;
                    value = line.x ? axis.getPixelForValue(line.x) : 0;
                    fontColor = line.fontColor || Chart.defaults.global.defaultFontColor;
                    fontFamily = line.fontFamily || Chart.defaults.global.defaultFontFamily;
                    fontSize = line.fontSize || Chart.defaults.global.defaultFontSize;

                    if (value) {
                        var bottom = Chart.defaults.scale.gridLines.drawTicks ? 
                            chart.chartArea.bottom + Chart.defaults.scale.gridLines.tickMarkLength :
                            chart.chartArea.bottom;
                        bottom = chart.chart.height;
                        VHLinePlugin.drawLine(ctx, borderWidth, borderColor, value, chart.chartArea.top, value, bottom);
                    }

                    if (line.text) {
                        ctx.fillStyle = fontColor;
                        ctx.font = fontSize + 'px ' + fontFamily;
                        ctx.fillText(line.text, value + borderWidth, chart.chartArea.top + fontSize / 2);
                    }
                }
            }
        },
        drawLine: function (ctx, borderWidth, borderColor, x1, y1, x2, y2) {
            ctx.lineWidth = borderWidth;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = borderColor;
            ctx.stroke();
        },
        defaults: {
            borderColor: 'rgba(169,169,169, .6)',
            borderWidth: 3
        }
    };
    Chart.pluginService.register(VHLinePlugin);
}(Chart));