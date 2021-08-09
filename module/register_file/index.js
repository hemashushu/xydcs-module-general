const { Binary } = require('jsbinary');
const { Signal, PinDirection, SimpleLogicModule } = require('jslogiccircuit');

/**
 * 寄存器堆，上升边沿触发。
 *
 */
class RegisterFile extends SimpleLogicModule {

    // override
    init() {
        // 数据位宽
        this._bitWidth = this.getParameter('bitWidth');

        // 地址的位宽
        this._addressBitWidth = this.getParameter('addressBitWidth');

        // 寄存器的数量由地址的位宽决定，比如 2 位地址共有 2 ^ 2 = 4 个寄存器，
        // 4 位地址共有 2 ^ 4 = 16 个寄存器
        this._registerCount = Math.pow(2, this._addressBitWidth);

        // 输入端口
        this._pinWriteAddress = this.addPin('writeAddress', this._addressBitWidth, PinDirection.input);
        this._pinWriteData = this.addPin('writeData', this._bitWidth, PinDirection.input);
        this._pinWriteEnable = this.addPin('writeEnable', 1, PinDirection.input);

        this._pinClock = this.addPin('Clock', 1, PinDirection.input);

        this._pinReadAddressA = this.addPin('readAddressA', this._addressBitWidth, PinDirection.input);
        this._pinReadAddressB = this.addPin('readAddressB', this._addressBitWidth, PinDirection.input);

        // 输出端口
        this._pinReadDataA = this.addPin('readDataA', this._bitWidth, PinDirection.output);
        this._pinReadDataB = this.addPin('readDataB', this._bitWidth, PinDirection.output);

        // 存储的值
        this._clockInt32Previous = 0;

        // 寄存器数组
        this._registers = new Array(this._registerCount);
    }

    // override
    updateModuleState() {
        let clockInt32 = this._pinClock.getSignal().getLevel().toInt32();

        let isRisingEdge = this._clockInt32Previous === 0 && clockInt32 === 1;
        this._clockInt32Previous = clockInt32;

        if (isRisingEdge) {
            let writeEnableInt32 = this._pinWriteEnable.getSignal().getLevel().toInt32();
            if (writeEnableInt32 === 1) {
                let writeDataInt32 = this._pinWriteData.getSignal().getLevel().toInt32();
                let writeAddressInt32 = this._pinWriteAddress.getSignal().getLevel().toInt32();
                this._registers[writeAddressInt32] = writeDataInt32;
            }

            let readAddressAInt32 = this._pinReadAddressA.getSignal().getLevel().toInt32();
            let readAddressBInt32 = this._pinReadAddressB.getSignal().getLevel().toInt32();

            let dataA = this._registers[readAddressAInt32];
            let dataB = this._registers[readAddressBInt32];

            let signalA = Signal.createWithoutHighZ(this._bitWidth,
                Binary.fromInt32(dataA, this._bitWidth));

            let signalB = Signal.createWithoutHighZ(this._bitWidth,
                Binary.fromInt32(dataB, this._bitWidth));

            this._pinReadDataA.setSignal(signalA);
            this._pinReadDataB.setSignal(signalB);
        }
    }
}

module.exports = RegisterFile;