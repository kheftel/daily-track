Controller = function () {
    this._datasets;
};

var p = Controller.prototype;

// DATA, LOADING /////////
p.getSetList = function (complete) {
    $.ajax({
        method: 'GET',
        url: '/api/sets/',
        success: (datasets) => {
            this._datasets = datasets;

            if(complete) complete();
        },

        error: (err) => {
            console.log(err);
            
            if(complete) complete();
        }
    });
}

Object.defineProperty(p, 'datasets', {
    get() {
        return this._chart.data.datasets;
    }
})

module.exports = Controller;