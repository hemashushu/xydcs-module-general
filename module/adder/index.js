const { Binary, Int32 } = require('jsbinary');
const { Signal, PinDirection, SimpleLogicModule } = require('jslogiccircuit');

/**
 * 加法器
 *
 */
class Adder extends SimpleLogicModule {

    // override
    init() {
        // 数据宽度
        this._bitWidth = this.getParameter('bitWidth');

        // 输入端口
        this._pinA = this.addPin('A', this._bitWidth, PinDirection.input);
        this._pinB = this.addPin('B', this._bitWidth, PinDirection.input);
        this._pinCin = this.addPin('Cin', 1, PinDirection.input); // Carry in

        // 输出端口
        this._pinS = this.addPin('S', this._bitWidth, PinDirection.output); // Sum
        this._pinCout = this.addPin('Cout', 1, PinDirection.output); // Carry out

        // 常量信号
        this._signalLow = Signal.createLow(1);
        this._signalHigh = Signal.createHigh(1);
    }

    // override
    updateModuleState() {
        let intA = this._pinA.getSignal().getLevel().toInt32();
        let intB = this._pinB.getSignal().getLevel().toInt32();
        let intCin = this._pinCin.getSignal().getLevel().toInt32();

        let intSum = intA + intB + intCin;
        let signalCout = this._signalLow;

        // 判断是否溢出
        if (this._bitWidth === 32) {
            // 结果小于加数
            if (Int32.greaterThanUnsigned(intA, intSum) ||
                Int32.greaterThanUnsigned(intB, intSum)){
                signalCout = this._signalHigh;
            }
        }else {
            // 第 bitWidth 位（索引值为 bitWidth 的位）的值为 1
            if ((intSum & Math.pow(2, this._bitWidth)) > 0) {
                signalCout = this._signalHigh;
            }
        }

        let binarySum = Binary.fromInt32(intSum, this._bitWidth);
        let signalS = Signal.createWithoutHighZ(this._bitWidth, binarySum);

        // 输出
        this._pinS.setSignal(signalS);
        this._pinCout.setSignal(signalCout);
    }
}

module.exports = Adder;