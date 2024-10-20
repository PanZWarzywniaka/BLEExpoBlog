/* eslint-disable no-bitwise */
import { useMemo, useState } from "react";
import { PermissionsAndroid, Platform } from "react-native";

import * as ExpoDevice from "expo-device";

import base64 from "react-native-base64";
import {
  BleError,
  BleManager,
  Characteristic,
  Device,
} from "react-native-ble-plx";

const SERVICE_UUID = "932c32bd-0000-47a2-835a-a8d455b859dd";
const POWER_UUID = "932c32bd-0002-47a2-835a-a8d455b859dd";

function useBLE() {
  const bleManager = useMemo(() => new BleManager(), []);

  const [availableDevices, setAvailableDevices] = useState<Device[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [isPowered, setPower] = useState<Boolean | null>(null);

  const onPowerChanged = (
    error: BleError | null,
    characteristic: Characteristic | null
  ) => {
    if (error) {
      console.log(error);
      return;
    }
    if (!characteristic?.value) {
      console.log("No data received!");
      return;
    }
    const rawData = characteristic.value;

    if (rawData == "AQ==") {
      console.log("Light on!");
      setPower(true);
    } else if (rawData == "AA==") {
      console.log("Light off!");
      setPower(false);
    } else {
      setPower(null);
      console.log(`got unknown state! value: ${rawData}`);
    }
  };

  const startStreamingData = async (device: Device) => {
    if (device) {
      device.monitorCharacteristicForService(
        SERVICE_UUID,
        POWER_UUID,
        onPowerChanged
      );
    } else {
      console.log("No device connected!");
    }
  };

  // it's a callback then we tap on the device to connect
  const connectToDevice = async (device: Device) => {
    try {
      console.log(`Connecting to ${device.name ?? device.localName}...`);
      const deviceConnection = await bleManager.connectToDevice(device.id);
      setConnectedDevice(deviceConnection);
      await deviceConnection.discoverAllServicesAndCharacteristics();
      bleManager.stopDeviceScan();
      startStreamingData(deviceConnection);
      console.log("Connected!");
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
  };
}

export default useBLE;
