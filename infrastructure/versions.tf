terraform {
  required_version = ">= 1.6.0"

  required_providers {
    tencentcloud = {
      source  = "tencentcloudstack/tencentcloud"
      version = "~> 1.82"
    }
  }
}

provider "tencentcloud" {
  region = var.region
}