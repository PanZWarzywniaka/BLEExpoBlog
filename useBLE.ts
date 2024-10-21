/* eslint-disable no-bitwise */
import { useMemo, useState } from "react";
import { PermissionsAndroid, Platform } from "react-native";

import * as ExpoDevice from "expo-device";

import { base64ToHex, hexToBase64 } from "./utils";

import {
  BleError,
  BleManager,
  Characteristic,
  Device,
} from "react-native-ble-plx";

const SERVICE_UUID = "932c32bd-0000-47a2-835a-a8d455b859dd";
const POWER_UUID = "932c32bd-0002-47a2-835a-a8d455b859dd";
const BRIGHTNESS_UUID = "932c32bd-0003-47a2-835a-a8d455b859dd";
const TEMPERATURE_UUID = "932c32bd-0004-47a2-835a-a8d455b859dd";

function useBLE() {
  const bleManager = useMemo(() => new BleManager(), []);

  const [availableDevices, setAvailableDevices] = useState<Device[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [isPowered, setPower] = useState<boolean>(false);
  const [brightness, setBrightness] = useState<number>(-1);
  const [temperature, setTemperature] = useState<number>(-1);

  const writeIntToDevice = async (
    newValue: Number,
    characteristicUUID: string
  ) => {
    console.log(`Writing state to bulb: ${newValue}`);
    if (!connectedDevice) {
      console.log("Writing attempt fail, there is no connectedDevice!");
      return;
    }

    const hexValue = newValue.toString(16);
    console.log(`Writing state to bulb: hex: ${hexValue}`);
    const b64Value = hexToBase64(hexValue);

    try {
      return await connectedDevice.writeCharacteristicWithoutResponseForService(
        SERVICE_UUID,
        characteristicUUID,
        b64Value
      );
    } catch (error) {
      console.log("Error sending data to the device", error);
    }
  };

  const readCharacteristic = (
    characteristic: Characteristic | undefined
  ): number | undefined => {
    if (!characteristic?.value) {
      console.log("No data received!");
      return;
    }
    const rawData = characteristic.value;
    const hexValue: string = base64ToHex(rawData);
    const intValue = parseInt(hexValue);
    return intValue;
  };

  const writeBrightnessData = async (newValue: number) => {
    const characteristic = await writeIntToDevice(newValue, BRIGHTNESS_UUID);
    const value = readCharacteristic(characteristic);
    setBrightness(value ?? -1);
  };

  const writeTemperatureData = async (newValue: number) => {
    // TODO Implement this python code here
    // temp = max(min(int(colour_temp), 500), 153)
    // y = temp.to_bytes(2, "little")
    return;
    const characteristic = await writeIntToDevice(newValue, TEMPERATURE_UUID);
    const value = readCharacteristic(characteristic);
    console.log(`New temperature recieved: ${value}`);
    setTemperature(newValue);
  };

  const writePowerData = async (powerOn: Boolean) => {
    const newValue = Number(powerOn);
    const characteristic = await writeIntToDevice(newValue, POWER_UUID);
    const intValue = readCharacteristic(characteristic);
    setPower(Boolean(intValue));
  };

  const getDeviceState = async (device: Device) => {
    console.log("Getting initial device state");
    if (!device) {
      console.log("No device connected!");
      return;
    }

    const powerCharacteristic = await device.readCharacteristicForService(
      SERVICE_UUID,
      POWER_UUID
    );
    const intValue = readCharacteristic(powerCharacteristic);
    setPower(Boolean(intValue));

    const brightnessCharacteristic = await device.readCharacteristicForService(
      SERVICE_UUID,
      BRIGHTNESS_UUID
    );
    const value = readCharacteristic(brightnessCharacteristic);
    setBrightness(value ?? -1);
  };

  // it's a callback then we tap on the device to connect
  const connectToDevice = async (device: Device) => {
    try {
      console.log(`Connecting to ${device.name ?? device.localName}...`);
      const deviceConnection = await bleManager.connectToDevice(device.id);
      setConnectedDevice(deviceConnection);

      deviceConnection.onDisconnected((error, device) => {
        console.log("Device disconnected!");
        setConnectedDevice(null);
        if (error) console.log(error);
      });

      await deviceConnection.discoverAllServicesAndCharacteristics();
      bleManager.stopDeviceScan();
      console.log("Connected!");

      // get first time data
      await getDeviceState(deviceConnection);

      // subscribe to the changes
      // startStreamingData(deviceConnection);
    } catch (e) {
      console.log("FAILED TO CONNECT", e);
    }
  };

  const requestAndroid31Permissions = async () => {
    const bluetoothScanPermission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      {
        title: "Location Permission",
        message: "Bluetooth Low Energy requires Location",
        buttonPositive: "OK",
      }
    );
    const bluetoothConnectPermission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      {
        title: "Location Permission",
        message: "Bluetooth Low Energy requires Location",
        buttonPositive: "OK",
      }
    );
    const fineLocationPermission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: "Location Permission",
        message: "Bluetooth Low Energy requires Location",
        buttonPositive: "OK",
      }
    );

    return (
      bluetoothScanPermission === "granted" &&
      bluetoothConnectPermission === "granted" &&
      fineLocationPermission === "granted"
    );
  };

  const requestPermissions = async () => {
    if (Platform.OS === "android") {
      if ((ExpoDevice.platformApiLevel ?? -1) < 31) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: "Location Permission",
            message: "Bluetooth Low Energy requires Location",
            buttonPositive: "OK",
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        const isAndroid31PermissionsGranted =
          await requestAndroid31Permissions();

        return isAndroid31PermissionsGranted;
      }
    } else {
      return true;
    }
  };

  const isDuplicteDevice = (devices: Device[], nextDevice: Device) =>
    devices.findIndex((device) => nextDevice.id === device.id) > -1;

  const scanForPeripherals = () =>
    bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.log(error);
      }

      if (device && (device.name || device.localName)) {
        setAvailableDevices((prevState: Device[]) => {
          // console.log(prevState)
          if (!isDuplicteDevice(prevState, device)) {
            return [...prevState, device];
          }
          return prevState;
        });
      }
    });

  return {
    connectToDevice,
    requestPermissions,
    scanForPeripherals,
    availableDevices,
    connectedDevice,
    isPowered,
    writePowerData,
    brightness,
    writeBrightnessData,
    temperature,
    writeTemperatureData,
  };
}

export default useBLE;
