const { Binary, Int32 } = require('jsbinary');
const { Signal, PinDirection, SimpleLogicModule } = require('jslogiccircuit');

/**
 * 减法器
 *
 */
class Subtract extends SimpleLogicModule {

    // override
    init() {
        // 数据宽度
        this._bitWidth = this.getParameter('bitWidth');

        // 输入端口
        this._pinA = this.addPin('A', this._bitWidth, PinDirection.input);
        this._pinB = this.addPin('B', this._bitWidth, PinDirection.input);

        // 借位输入，0 表示借位，1 表示不借位
        this._pin_Bin = this.addPin('_Bin', 1, PinDirection.input);

        // 输出端口
        this._pinS = this.addPin('S', this._bitWidth, PinDirection.output); // Sub

        // 借位输出，0 表示借位，1 表示不借位
        this._pin_Bout = this.addPin('_Bout', 1, PinDirection.output);

        this._signalLow = Signal.createLow(1);
        this._signalHigh = Signal.createHigh(1);
    }

    // override
    updateModuleState() {
        let intA = this._pinA.getSignal().getLevel().toInt32();
        let intB = this._pinB.getSignal().getLevel().toInt32();
        let int_Bin = this._pin_Bin.getSignal().getLevel().toInt32();

        let intSubtrahend = intB + (1 - int_Bin); // _Bin 0 表示借位， 1 表示不借位
        let intSub = intA - intSubtrahend;
        let signal_Bout = this._signalHigh; // _Bout 0 表示借位， 1 表示不借位

        // 判断是否需要借位
        if (Int32.greaterThanUnsigned(intB, intA) ||
            Int32.greaterThanUnsigned(intSubtrahend, intA)){
            signal_Bout = this._signalLow;
        }

        let binarySub = Binary.fromInt32(intSub, this._bitWidth);
        let signalS = Signal.createWithoutHighZ(this._bitWidth, binarySub);

        // 输出
        this._pinS.setSignal(signalS);
        this._pin_Bout.setSignal(signal_Bout);
    }
}

module.exports = Subtract;