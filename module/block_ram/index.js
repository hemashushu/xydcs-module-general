const { Binary } = require('jsbinary');
const { Signal, PinDirection, SimpleLogicModule } = require('jslogiccircuit');

/**
 * Block RAM，常见于 FPGA，速度快延迟低，因为是连续的储存单元，所以称为 “块”。当允许写入时，先读出已存储的数据，然后才存储新的数据。即同一个地址输出的数据比输入的慢一个时钟周期。
 *
 * - 在时钟上升沿时存储数据及输出数据
 * - 如果同时允许写入和读取，先读出已存储的数据，然后才存储新的数据。即同一个地址输出的数据比输入的慢一个时钟周期。
 * - 当 readEnable 为低电平时，输出高阻抗。
 * - writeEnable 和 readEnable 可以同时设置为 1 或者 0，作为片选信号（Chip select），从而
 *   实现使用多个小容量的 RAM 构成一个大容量的 RAM。
 */
class BlockRAM extends SimpleLogicModule {

    // override
    init() {
        // 数据位宽
        this._bitWidth = this.getParameter('bitWidth');

        // 地址的位宽
        this._addressBitWidth = this.getParameter('addressBitWidth');

        // 存储单元的数量由地址的位宽决定，比如 2 位地址共有 2 ^ 2 = 4 个存储单元，
        // 8 位地址共有 2 ^ 8 = 256 个存储单元
        this._storeUnitCount = Math.pow(2, this._addressBitWidth);

        // 输入端口

        // 地址为存储单元的地址，不是以 byte 为单位的地址。
        // 例如存储单元为 32 位，则地址 0 将会读第一个存储单元的值（4 个字节），
        // 地址 1 将会读取第 2 个存储单元的值（同样 4 个字节）
        this._pinAddress = this.addPin('address', this._addressBitWidth, PinDirection.input);
        this._pinDataIn = this.addPin('dataIn', this._bitWidth, PinDirection.input);
        this._pinWriteEnable = this.addPin('writeEnable', 1, PinDirection.input);
        this._pinReadEnable = this.addPin('readEnable', 1, PinDirection.input);

        this._pinClock = this.addPin('Clock', 1, PinDirection.input);

        // 输出端口
        this._pinDataOut = this.addPin('dataOut', this._bitWidth, PinDirection.output);

        // 存储的值
        this._clockInt32Previous = 0;

        // 存储单元数组
        this._storeUnits = new Array(this._storeUnitCount);
        for (let idx = 0; idx < this._storeUnitCount; idx++) {
            this._storeUnits[idx] = 0;
        }

        // 读取配置的初始化数据
        // 返回的是一个 Buffer 对象
        // https://nodejs.org/api/buffer.html
        let initialData = this.getParameter('initialData');
        if (initialData !== undefined && initialData !== null) {
            let wordSize = this._bitWidth / 8; // 计算一个字有多少个字节，即字长
            let initialDataBytes = initialData.length; //  https://nodejs.org/api/buffer.html#buffer_buf_length
            let initialDataLength = Math.ceil(initialDataBytes / wordSize); // 不足 1 个字的算 1 一个字
            let availableLength = Math.min(this._storeUnitCount, initialDataLength);

            for (let idx = 0; idx < availableLength; idx++) {
                // 由 bytes 数组按字长计算得字值。
                let wordValue = 0;
                for (let byteIdx = 0; byteIdx < wordSize; byteIdx++) {
                    let byteValue = initialData[idx * wordSize + byteIdx] ?? 0;
                    wordValue |= (byteValue << (byteIdx * 8));
                }
                this._storeUnits[idx] = wordValue;
            }
        }

        // 常量信号
        this._signalHighZ = Signal.createHighZ(this._bitWidth);
    }

    // override
    updateModuleState() {
        let clockInt32 = this._pinClock.getSignal().getLevel().toInt32();

        let isRisingEdge = this._clockInt32Previous === 0 && clockInt32 === 1;
        this._clockInt32Previous = clockInt32;

        if (isRisingEdge) {
            // 先读取已存储的数据，再写入数据
            // 因此同一个地址读取的数据总是比输入数据慢一个时钟周期

            // readEnable 为低电平时，输出高阻抗
            let readEnableInt32 = this._pinReadEnable.getSignal().getLevel().toInt32();
            if (readEnableInt32 === 1) {
                let addressInt32 = this._pinAddress.getSignal().getLevel().toInt32();
                let data = this._storeUnits[addressInt32];
                let signal = Signal.createWithoutHighZ(this._bitWidth, Binary.fromInt32(data, this._bitWidth));
                this._pinDataOut.setSignal(signal);
            } else {
                this._pinDataOut.setSignal(this._signalHighZ);
            }

            let writeEnableInt32 = this._pinWriteEnable.getSignal().getLevel().toInt32();
            if (writeEnableInt32 === 1) {
                let dataInInt32 = this._pinDataIn.getSignal().getLevel().toInt32();
                let addressInt32 = this._pinAddress.getSignal().getLevel().toInt32();
                this._storeUnits[addressInt32] = dataInInt32;
            }
        }
    }
}

module.exports = BlockRAM;