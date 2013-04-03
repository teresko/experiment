/*jslint browser: true, plusplus: true */

(function () {

    "use strict";

    var canvas = document.getElementById('screen'),
        map,
        ui,

        hasClass = function (element, klass) {
            return element.className.match(new RegExp('(\\s|^)' + klass + '(\\s|$)'));
        },

        on = (function () {
            var fix = {
                'focus':    'focusin',
                'blur':     'focusout'
            };
            
            if (window.addEventListener) {
                return function (type, element, callback) {
                    element.addEventListener(type, callback, typeof fix[type] !== undefined);
                };
            }
            return function (type, element, callback) {
                type = fix[type] || type;
                element.attachEvent('on' + type, callback);
            };
        }()),

        hexagon = function (dx, dy) {

            var k = 0.8660, x, y, radius, context;

            return {


                init: function(params) {                  
                    x = params.left + params.radius * dx;
                    y = params.top + params.radius * dy;
                    radius = params.radius;
                    context = params.context;
                },

                draw: function (color) {

                    context.strokeStyle = color || 'rgba(200, 200, 200, 1)';
                    context.beginPath();
                    context.moveTo(x, y - radius);
                    context.lineTo(x + k * radius, y - 0.5 * radius);
                    context.lineTo(x + k * radius, y + 0.5 * radius);
                    context.lineTo(x, y + radius);
                    context.lineTo(x - k * radius, y + 0.5 * radius);
                    context.lineTo(x - k * radius, y - 0.5 * radius);
                    context.lineTo(x, y - radius);
                    context.stroke();
                },

                getCoords: function () {
                    return {left: x, top: y};
                },


                toggle: function (highlight) {
                    var color = '';

                    context.globalCompositeOperation = 'destination-out';
                    context.fillStyle = "rgba(32, 32, 32, 1)";
                    context.beginPath();
                    context.arc(x, y, radius+1, 0, Math.PI*2, true);
                    context.fill();

                    context.globalCompositeOperation = 'source-over';

                    if (highlight) {
                        color = 'rgba(100, 100, 255, 1)';
                    }

                    this.draw(color);
                }

            };
        },


        scape = function (canvas) {
            var context = canvas.getContext('2d');

            canvas.width  = window.innerWidth;
            canvas.height = window.innerHeight;

            return {

                add: function (element, parameters) {
                    element.draw(context, parameters);
                }

                
            };
        },


        board = function (blueprint, size, membrane) {

            return {

                tiles : [],

                init: function () {

                    var k = 0.8660,
                        gx = size * 2,
                        gy = gx * k,
                        project = this.project(size),
                        dx,
                        dy,
                        n,
                        i,
                        j,
                        max,
                        indices;

                    this.prepareTiles(size);


                    for (i = 0; i < size * 2 - 1; i++) {

                        n = Math.abs(size - 1 - i);
                        max = (size * 2 - 1) - n;

                        dx = n - gx;
                        dy = 2 * k * i - gy;

                        for (j = 0; j < max; j++) {
                            dx += 2;

                            indices = project(i, j, n);
                            this.tiles[indices.i][indices.j] = blueprint(dx, dy);
                        }
                    }


                },


                draw: function (context, params) {
                    var tiles = this.tiles, 
                        i = tiles.length, 
                        j, 
                        item, 
                        dimensions;

                    while (i--) {
                        for (j in tiles[i]) {
                            if (tiles[i].hasOwnProperty(j)) {
                                item = tiles[i][j];
                                params.context = context;
                                item.init(params);
                                item.draw();
                                dimensions = item.getCoords();
                                //dimensions.width = dimensions.height = '20px';
                                membrane.add(item.toggle, item, dimensions);
                            }
                        }
                    }
                },

                prepareTiles: function (side) {
                    var i = side * 2 - 1;

                    while (i--) {
                        this.tiles[i] = [];
                    }
                },

                project: function (side) {
                    return function (i, j, k) {
                        var a, b = j + k;

                        if ((side - i) <= 0) {
                            b -= k;
                        }

                        a = i + (b - side) / 2;

                        if ((b + side) % 2 !== 0) {
                            a = i + (b - side + 1) / 2;
                        }

                        return {i: a, j: b};
                    };
                }
            };
        },


        sensors = function ( container ) {

            var fragment = document.createDocumentFragment(), sensors = [];

            return {

                add: function (signal, sensor, params) {
                    var item = document.createElement("div");

                    params.type = params.type || 'area';

                    fragment.appendChild(item);
                    item.classList.add('sensor');
                    item.classList.add(params.type);
                    item.style.left = params.left;
                    item.style.top = params.top;
                    //item.style.width = params.width;
                    //item.style.height = params.height;


                    item.signal = signal;
                    item.sensor = sensor;
                },

                render: function () {
                    container.appendChild(fragment);
                    fragment = document.createDocumentFragment();
                }

            };

        },

        observe = function (e) {
            var event = e || window.event, n, 
                target = event.target || event.srcElement;

            if (target.classList.contains('sensor')) {
                target.signal.call( target.sensor, target.classList.toggle('active') );
            }

        },


        grid = document.getElementById('grid'),
        membrane = sensors(grid);



    if (canvas.getContext === 'undefined') {
        return;
    }



    ui = scape(canvas);

    map = board(hexagon, 4, membrane);
    map.init();

    ui.add(map, { left: window.innerWidth / 2, 
                  top: window.innerHeight / 2, 
                  radius: 30});

    membrane.render();

    on('mouseover', grid, observe);
    on('mouseout', grid, observe);


}());