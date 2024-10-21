import React, { useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Slider from "@react-native-community/slider";

import DeviceModal from "./DeviceConnectionModal";
import useBLE from "./useBLE";

const App = () => {
  const {
    connectToDevice,
    requestPermissions,
    scanForPeripherals,
    availableDevices,
    connectedDevice,
    isPowered,
    writePowerData,
    brightness,
    writeBrightnessData,
  } = useBLE();

  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);

  const scanForDevices = async () => {
    const isPermissionsEnabled = await requestPermissions();
    console.log("Scanning for devices...");
    if (isPermissionsEnabled) {
      console.log("Permissions enabled!");
      scanForPeripherals();
    }
  };

  const hideModal = () => {
    setIsModalVisible(false);
  };

  const openModal = async () => {
    scanForDevices();
    setIsModalVisible(true);
  };

  const togglePower = async () => {
    const newState = !isPowered;
    await writePowerData(newState);
  };

  const onBrightnessChange = async (new_value: number) => {
    writeBrightnessData(new_value);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.titleWrapper}>
        {connectedDevice ? (
          <>
            <Text style={styles.titleText}>Connected ✅</Text>
            <View style={styles.menuItem}>
              <Text style={styles.menuText}>Power</Text>
              <Switch onValueChange={togglePower} value={isPowered} />
            </View>
            <View style={styles.menuItem}>
              <Text style={styles.menuText}>Brightness</Text>
              <Slider
                style={{ width: 200, height: 40 }}
                value={brightness}
                minimumValue={0}
                maximumValue={255}
                step={10}
                onValueChange={onBrightnessChange}
              />
            </View>
            <View style={styles.menuItem}>
              <Text style={styles.menuText}>Temperature</Text>
              <Slider
                style={{ width: 200, height: 40 }}
                minimumValue={153}
                maximumValue={500}
                step={20}
              />
            </View>
          </>
        ) : (
          <Text style={styles.titleText}>Please connect the Lightbulb</Text>
        )}
      </View>

      <TouchableOpacity onPress={openModal} style={styles.ctaButton}>
        <Text style={styles.ctaButtonText}>Connect</Text>
      </TouchableOpacity>

      <DeviceModal
        closeModal={hideModal}
        visible={isModalVisible}
        connectToPeripheral={connectToDevice}
        devices={availableDevices}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f2",
  },
  titleWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  titleText: {
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center",
    marginHorizontal: 20,
    color: "black",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuText: {
    fontSize: 30,
    textAlign: "center",
    marginHorizontal: 20,
    color: "black",
  },
  ctaButton: {
    backgroundColor: "#FF6060",
    justifyContent: "center",
    alignItems: "center",
    height: 50,
    marginHorizontal: 20,
    marginBottom: 5,
    borderRadius: 8,
  },
  ctaButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
});

export default App;
