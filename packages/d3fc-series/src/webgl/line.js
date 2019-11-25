import xyBase from '../xyBase';
import { glLine, scaleMapper, uniformBuilder } from '@d3fc/d3fc-webgl';
import { rebindAll, exclude, rebind } from '@d3fc/d3fc-rebind';

export default () => {
    const base = xyBase();
    let context = null;
    let width = 1;

    let draw = glLine();

    const line = (data) => {
        const xScale = scaleMapper(base.xScale());
        const yScale = scaleMapper(base.yScale());

        const accessor = getAccessors();

        const x = new Float32Array(data.length);
        const y = new Float32Array(data.length);
        const defined = new Float32Array(data.length);

        data.forEach((d, i) => {
            x[i] = xScale.scale(accessor.x(d, i));
            y[i] = yScale.scale(accessor.y(d, i));
            defined[i] = accessor.defined(d, i);
        });

        draw.xValues(x)
            .yValues(y)
            .defined(defined)
            .xScale(xScale.glScale)
            .yScale(yScale.glScale)
            .width(width)
            .decorate((program) => {
                program.buffers().uniform('uScreen', uniformBuilder([
                    program.context().canvas.width,
                    program.context().canvas.height
                ]));

                base.decorate()(program, data, 0);
            });

        draw(data.length);
    };

    function getAccessors() {
        if (base.orient() === 'vertical') {
            return {
                x: base.crossValue(),
                y: base.mainValue(),
                defined: base.defined()
            };
        } else {
            return {
                x: base.mainValue(),
                y: base.crossValue(),
                defined: base.defined()
            };
        }
    }

    line.context = (...args) => {
        if (!args.length) {
            return context;
        }
        context = args[0];
        return line;
    };

    line.width = (...args) => {
        if (!args.length) {
            return width;
        }
        width = args[0];
        return line;
    };

    rebindAll(line, base, exclude('baseValue', 'bandwidth', 'align'));
    rebind(line, draw, 'context');

    return line;
};