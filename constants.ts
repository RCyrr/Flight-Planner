import type { CameraParams } from './types';

export const DJI_MINI_4_PRO_CAMERA: CameraParams = {
  // 1/1.3-inch CMOS sensor dimensions in mm
  sensorWidth: 9.83,
  sensorHeight: 7.37,
  // Actual focal length for 24mm equivalent lens
  focalLength: 6.72,
  // 4:3 aspect ratio, 12MP mode
  imageWidth: 4000,
  imageHeight: 3000,
};

export const DJI_MAVIC_3_ENTERPRISE_CAMERA: CameraParams = {
  // 4/3 CMOS sensor
  sensorWidth: 17.3,
  sensorHeight: 13.0,
  // Actual focal length for 24mm equivalent lens
  focalLength: 12.29,
  // 4:3 aspect ratio, 20MP mode
  imageWidth: 5280,
  imageHeight: 3956,
};

export const DJI_PHANTOM_4_RTK_CAMERA: CameraParams = {
    // 1-inch CMOS sensor
    sensorWidth: 13.2,
    sensorHeight: 8.8,
    // Actual focal length for 24mm equivalent lens
    focalLength: 8.8,
    // 3:2 aspect ratio, 20MP mode
    imageWidth: 5472,
    imageHeight: 3648,
};

export const DJI_M300_P1_35MM_CAMERA: CameraParams = {
    // Full-frame sensor with 35mm lens
    sensorWidth: 35.9,
    sensorHeight: 24.0,
    focalLength: 35.0,
    // 3:2 aspect ratio, 45MP mode
    imageWidth: 8192,
    imageHeight: 5460,
};

export const SKYDIO_X10_WIDE_CAMERA: CameraParams = {
    // 1/1.8-inch CMOS sensor
    sensorWidth: 7.06,
    sensorHeight: 5.3,
    focalLength: 4.35,
    // 4:3 aspect ratio, 64MP mode
    imageWidth: 9248,
    imageHeight: 6944,
};


export const CAMERA_PRESETS: { [key: string]: CameraParams } = {
  'DJI Mini 4 Pro': DJI_MINI_4_PRO_CAMERA,
  'DJI Mavic 3 / 3E': DJI_MAVIC_3_ENTERPRISE_CAMERA,
  'DJI Phantom 4 RTK': DJI_PHANTOM_4_RTK_CAMERA,
  'DJI M300 + P1 (35mm)': DJI_M300_P1_35MM_CAMERA,
  'Skydio X10 (Wide)': SKYDIO_X10_WIDE_CAMERA,
};
