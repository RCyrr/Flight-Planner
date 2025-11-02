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

export const DJI_MAVIC_3_CAMERA: CameraParams = {
  // 4/3 CMOS sensor
  sensorWidth: 17.3,
  sensorHeight: 13.0,
  // Actual focal length for 24mm equivalent lens
  focalLength: 12.29,
  // 4:3 aspect ratio, 20MP mode
  imageWidth: 5280,
  imageHeight: 3956,
};


export const CAMERA_PRESETS: { [key: string]: CameraParams } = {
  'DJI Mini 4 Pro': DJI_MINI_4_PRO_CAMERA,
  'DJI Mavic 3': DJI_MAVIC_3_CAMERA,
};
