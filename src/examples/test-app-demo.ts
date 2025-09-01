/**
 * Demonstração prática das funcionalidades implementadas no KMBio
 * Este arquivo mostra como testar cada componente do sistema
 */

import { OBDService } from '../services/obd/OBDService';
import { BLEServiceInterface } from '../types/ble';
import {
    parseVehicleData,
    calculateFuelConsumptionFromMAF,
    detectDrivingEvents,
    validateVehicleData
} from '../utils/obd-calculations';
import { OBD_PIDS } from '../constants/pids';

// Mock BLE Service para demonstração
class DemoBLEService implements BLEServiceInterface {
    private connected = false;
    private scenario: 'idle' | 'city' | 'highway' | 'sport' = 'idle';

    // Simular diferentes cenários de direção
    setDrivingScenario(scenario: 'idle' | 'city' | 'highway' | 'sport') {
        this.scenario = scenario;
        console.log(`🚗 Cenário alterado para: ${scenario}`);
    }

    async scanForDevices() {
        console.log('🔍 Escaneando dispositivos BLE...');
        return [
            {
                id: 'elm327-demo',
                name: 'ELM327 Demo Device',
                rssi: -50,
                isConnectable: true
            },
            {
                id: 'obd-simulator',
                name: 'OBD Simulator',
                rssi: -60,
                isConnectable: true
            }
        ];
    }

    async connectToDevice(deviceId: string) {
        console.log(`🔗 Conectando ao dispositivo: ${deviceId}`);
        await this.delay(1000);
        this.connected = true;
        console.log('✅ Conectado com sucesso!');
    }

    async disconnect() {
        console.log('🔌 Desconectando...');
        this.connected = false;
    }

    isConnected() {
        return this.connected;
    }

    getConnectionState() {
        return {
            isScanning: false,
            isConnecting: false,
            isConnected: this.connected,
            availableDevices: [],
            connectionAttempts: 0
        };
    }

    async sendCommand(command: string): Promise<string> {
        if (!this.connected) {
            throw new Error('Dispositivo não conectado');
        }

        // Simular delay de comunicação
        await this.delay(50);

        // Retornar respostas baseadas no cenário atual
        return this.getMockResponse(command);
    }

    private getMockResponse(command: string): string {
        const responses = this.getScenarioResponses();
        return responses[command] || 'NO DATA';
    }

    private getScenarioResponses(): Record<string, string> {
        const baseResponses = {
            'ATZ\r': 'ELM327 v1.5',
            'ATE0\r': 'OK',
            'ATL0\r': 'OK',
            'ATH0\r': 'OK',
            'ATS0\r': 'OK',
            'ATST32\r': 'OK',
            'ATAT1\r': 'OK',
            'ATSP0\r': 'OK',
            'ATDP\r': 'CAN 11/500',
            '0100\r': '4100BE3EA813',
            '0120\r': '412098180001',
            '0140\r': '414040000000',
        };

        const scenarioData = {
            idle: {
                '010C\r': '410C0BB8', // 750 RPM
                '010D\r': '410D00',   // 0 km/h
                '0105\r': '41055A',   // 50°C
                '0110\r': '41100A28', // 26.0 g/s MAF
                '010B\r': '410B32',   // 50 kPa MAP
                '0111\r': '411110',   // 6.3% throttle
            },
            city: {
                '010C\r': '410C1770', // 1500 RPM
                '010D\r': '410D32',   // 50 km/h
                '0105\r': '41056E',   // 70°C
                '0110\r': '41101F40', // 80.0 g/s MAF
                '010B\r': '410B64',   // 100 kPa MAP
                '0111\r': '411180',   // 50.2% throttle
            },
            highway: {
                '010C\r': '410C0FA0', // 1000 RPM
                '010D\r': '410D78',   // 120 km/h
                '0105\r': '410578',   // 80°C
                '0110\r': '41101388', // 50.0 g/s MAF
                '010B\r': '410B50',   // 80 kPa MAP
                '0111\r': '411140',   // 25.1% throttle
            },
            sport: {
                '010C\r': '410C2EE0', // 3000 RPM
                '010D\r': '410D5A',   // 90 km/h
                '0105\r': '410582',   // 90°C
                '0110\r': '41103E80', // 160.0 g/s MAF
                '010B\r': '410B78',   // 120 kPa MAP
                '0111\r': '4111C0',   // 75.3% throttle
            }
        };

        return { ...baseResponses, ...scenarioData[this.scenario] };
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Métodos não utilizados na demo
    startDataCollection() { }
    stopDataCollection() { }
    onConnectionStateChange() { }
    onDataReceived() { }
    onError() { }
}

/**
 * Demonstração completa do sistema KMBio
 */
export class KMBioDemo {
    private obdService: OBDService;
    private bleService: DemoBLEService;
    private previousData?: any;

    constructor() {
        this.bleService = new DemoBLEService();
        this.obdService = new OBDService(this.bleService);
    }

    /**
     * Executar demonstração completa
     */
    async runCompleteDemo() {
        console.log('🚀 === DEMONSTRAÇÃO KMBIO ===\n');

        try {
            // 1. Testar conexão BLE
            await this.demoBluetoothConnection();

            // 2. Testar inicialização OBD
            await this.demoOBDInitialization();

            // 3. Testar diferentes cenários de direção
            await this.demoDrivingScenarios();

            // 4. Testar cálculos e análises
            await this.demoCalculationsAndAnalysis();

            // 5. Testar detecção de eventos
            await this.demoEventDetection();

            console.log('\n🎉 === DEMONSTRAÇÃO CONCLUÍDA ===');
            console.log('✅ Todas as funcionalidades testadas com sucesso!');

        } catch (error) {
            console.error('❌ Erro na demonstração:', error);
        }
    }

    /**
     * Demonstrar conexão Bluetooth
     */
    private async demoBluetoothConnection() {
        console.log('📱 === TESTE DE CONEXÃO BLUETOOTH ===');

        // Escanear dispositivos
        const devices = await this.bleService.scanForDevices();
        console.log('Dispositivos encontrados:', devices);

        // Conectar ao primeiro dispositivo
        if (devices.length > 0) {
            await this.bleService.connectToDevice(devices[0].id);
            console.log(`Estado da conexão: ${this.bleService.getConnectionState()}`);
        }

        console.log('');
    }

    /**
     * Demonstrar inicialização OBD
     */
    private async demoOBDInitialization() {
        console.log('🔧 === INICIALIZAÇÃO OBD-II ===');

        // Inicializar serviço OBD
        await this.obdService.initialize();
        console.log('✅ OBD inicializado com sucesso');

        // Descobrir PIDs suportados
        const supportedPIDs = await this.obdService.getSupportedPIDs();
        console.log(`📊 PIDs suportados (${supportedPIDs.length}):`, supportedPIDs.slice(0, 5), '...');

        // Testar conexão
        const isValid = await this.obdService.validateConnection();
        console.log(`🔍 Validação da conexão: ${isValid ? '✅ OK' : '❌ Falhou'}`);

        console.log('');
    }

    /**
     * Demonstrar diferentes cenários de direção
     */
    private async demoDrivingScenarios() {
        console.log('🚗 === CENÁRIOS DE DIREÇÃO ===');

        const scenarios = [
            { name: 'Parado (Idle)', key: 'idle' as const },
            { name: 'Cidade', key: 'city' as const },
            { name: 'Rodovia', key: 'highway' as const },
            { name: 'Esportivo', key: 'sport' as const }
        ];

        for (const scenario of scenarios) {
            console.log(`\n🎯 Testando cenário: ${scenario.name}`);

            // Alterar cenário
            this.bleService.setDrivingScenario(scenario.key);

            // Coletar dados
            const responses = await this.obdService.readEssentialData();
            const vehicleData = parseVehicleData(responses);

            // Exibir dados
            console.log(`   RPM: ${vehicleData.rpm || 'N/A'} rpm`);
            console.log(`   Velocidade: ${vehicleData.speed || 'N/A'} km/h`);
            console.log(`   Temperatura: ${vehicleData.engineTemp || 'N/A'}°C`);
            console.log(`   MAF: ${vehicleData.maf || 'N/A'} g/s`);
            console.log(`   Throttle: ${vehicleData.throttlePosition || 'N/A'}%`);

            // Calcular consumo se MAF disponível
            if (vehicleData.maf) {
                const consumption = calculateFuelConsumptionFromMAF(vehicleData.maf, 'gasoline');
                console.log(`   💧 Consumo: ${consumption} L/h`);
            }

            await this.delay(1000);
        }

        console.log('');
    }

    /**
     * Demonstrar cálculos e análises
     */
    private async demoCalculationsAndAnalysis() {
        console.log('📊 === CÁLCULOS E ANÁLISES ===');

        // Testar cenário de rodovia
        this.bleService.setDrivingScenario('highway');
        const responses = await this.obdService.readEssentialData();
        const vehicleData = parseVehicleData(responses);

        console.log('Dados coletados:', vehicleData);

        // Validar dados
        const validation = validateVehicleData(vehicleData);
        console.log(`\n🔍 Validação dos dados:`);
        console.log(`   Status: ${validation.isValid ? '✅ Válido' : '❌ Inválido'}`);
        if (validation.warnings.length > 0) {
            console.log(`   Avisos: ${validation.warnings.join(', ')}`);
        }
        if (validation.errors.length > 0) {
            console.log(`   Erros: ${validation.errors.join(', ')}`);
        }

        // Cálculos de consumo
        if (vehicleData.maf && vehicleData.speed) {
            const consumptionLH = calculateFuelConsumptionFromMAF(vehicleData.maf, 'gasoline');
            const consumption100km = (consumptionLH * 100) / vehicleData.speed;
            const kmPerLiter = 100 / consumption100km;

            console.log(`\n⛽ Análise de Consumo:`);
            console.log(`   Instantâneo: ${consumptionLH} L/h`);
            console.log(`   Por 100km: ${consumption100km.toFixed(2)} L/100km`);
            console.log(`   Eficiência: ${kmPerLiter.toFixed(2)} km/L`);
        }

        console.log('');
    }

    /**
     * Demonstrar detecção de eventos
     */
    private async demoEventDetection() {
        console.log('🚨 === DETECÇÃO DE EVENTOS ===');

        // Simular sequência de eventos
        const scenarios = [
            { name: 'Parado', scenario: 'idle' as const },
            { name: 'Aceleração', scenario: 'sport' as const },
            { name: 'Rodovia', scenario: 'highway' as const },
            { name: 'Frenagem', scenario: 'city' as const }
        ];

        let previousData: any = undefined;

        for (const { name, scenario } of scenarios) {
            console.log(`\n📍 ${name}:`);

            this.bleService.setDrivingScenario(scenario);
            const responses = await this.obdService.readEssentialData();
            const currentData = parseVehicleData(responses);

            // Detectar eventos
            if (previousData) {
                const events = detectDrivingEvents(currentData, previousData, 1000);

                if (events.length > 0) {
                    events.forEach(event => {
                        const severityIcon = {
                            low: '🟡',
                            medium: '🟠',
                            high: '🔴'
                        }[event.severity];

                        console.log(`   ${severityIcon} ${event.type}: ${event.description}`);
                    });
                } else {
                    console.log('   ✅ Nenhum evento detectado');
                }
            }

            previousData = currentData;
            await this.delay(1000);
        }

        console.log('');
    }

    /**
     * Testar funcionalidade específica
     */
    async testSpecificFeature(feature: 'obd' | 'calculations' | 'events' | 'bluetooth') {
        console.log(`🎯 Testando funcionalidade: ${feature.toUpperCase()}`);

        switch (feature) {
            case 'bluetooth':
                await this.demoBluetoothConnection();
                break;
            case 'obd':
                await this.demoBluetoothConnection();
                await this.demoOBDInitialization();
                break;
            case 'calculations':
                await this.demoBluetoothConnection();
                await this.demoOBDInitialization();
                await this.demoCalculationsAndAnalysis();
                break;
            case 'events':
                await this.demoBluetoothConnection();
                await this.demoOBDInitialization();
                await this.demoEventDetection();
                break;
        }
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Exemplo de uso
export async function runKMBioDemo() {
    const demo = new KMBioDemo();

    // Executar demonstração completa
    await demo.runCompleteDemo();

    // Ou testar funcionalidade específica
    // await demo.testSpecificFeature('obd');
}

// Para executar no console do navegador ou Node.js:
// import { runKMBioDemo } from './src/examples/test-app-demo';
// runKMBioDemo();