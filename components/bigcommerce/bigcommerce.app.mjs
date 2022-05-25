import { axios } from "@pipedream/platform";
import constants from "./common/constants.mjs";
export default {
  type: "app",
  app: "bigcommerce",
  propDefinitions: {
    channel: {
      type: "boolean",
      label: "Using channel",
      description: "Channel of the webhook",
    },
    maxRequests: {
      type: "integer",
      min: 1,
      max: 180,
      label: "Max API Requests per Execution (advanced)",
      description:
        "The maximum number of API requests to make per execution (e.g., multiple requests are required to retrieve paginated results).",
      optional: true,
      default: 1,
    },
    productId: {
      type: "integer",
      label: "Product Id",
      description: "The id of the product",
    },
    categoryId: {
      type: "integer",
      label: "Category Id",
      description: "The id of the category",
      async options({ page }) {
        const categories = await this.getAllCategories({
          page: page + 1,
        });
        return categories.map((item) => ({
          label: item.name,
          value: item.id,
        }));
      },
    },
  },
  methods: {
    _getHeaders() {
      return {
        "X-Auth-Token": `${this.$auth.access_token}`,
      };
    },
    async _makeRequest({
      $, url, path, version = "v3", ...otherConfig
    }) {
      const baseUrl = `${constants.BASE_URL}/${this.$auth.store_hash}`;

      const config = {
        url: url || `${baseUrl}/${version}${path}`,
        headers: this._getHeaders(),
        ...otherConfig,
      };

      return axios($ || this, config);
    },
    async deleteHook(hookId) {
      return this._makeRequest({
        method: "DELETE",
        path: `/hooks/${hookId}`,
      });
    },
    async createHook(
      webhookUrl,
      type,
      scope = "created",
      channel = null,
      channelId = null,
    ) {
      const channelScope = `${channel
        ? `channel/${channelId}/`
        : ""}`;

      const { data } = await this._makeRequest({
        method: "POST",
        path: "/hooks",
        data: {
          scope: `store/${channelScope}${type}/${scope}`,
          destination: webhookUrl,
          is_active: true,
        },
      });

      return data.id;
    },
    async getAllProducts({
      $, page,
    }) {
      return await this._makeRequest({
        $,
        method: "GET",
        path: `/catalog/products?limit=50&page=${page}`,
      });
    },
    async getAllProductsSortOrder({
      $, categoryId, page,
    }) {
      return await this._makeRequest({
        $,
        method: "GET",
        path: `/catalog/categories/${categoryId}/products/sort-order?limit=50&page=${page}`,
      });
    },
    async getProduct({
      $, productId,
    }) {
      return await this._makeRequest({
        $,
        method: "GET",
        path: `/catalog/products/${productId}`,
      });
    },
    async getProductVariants({
      $, productId,
    }) {
      return await this._makeRequest({
        $,
        method: "GET",
        path: `/catalog/products/${productId}/variants`,
      });
    },
    async createProduct({
      $, props,
    }) {
      return await this._makeRequest({
        $,
        method: "POST",
        path: "/catalog/products",
        data: props,
      });
    },
    async updateProduct({
      $, props,
    }) {
      const {
        productId, ...data
      } = props;
      return await this._makeRequest({
        $,
        method: "PUT",
        path: `/catalog/products/${productId}`,
        data,
      });
    },
    async deleteProduct({
      $, productId,
    }) {
      return await this._makeRequest({
        $,
        method: "DELETE",
        path: `/catalog/products/${productId}`,
      });
    },
    async getAllTaxClasses({
      $, page = 1, limit = 2,
    }) {
      return await this._makeRequest({
        $,
        method: "GET",
        path: `/tax_classes?page=${page}&limit=${limit}`,
        version: "v2",
      });
    },
    async getAllCategories({
      $, page = 1, limit = 100,
    }) {
      return await this._makeRequest({
        $,
        method: "GET",
        path: `/categories?page=${page}&limit=${limit}`,
        version: "v2",
      });
    },
    async getAllBrands({
      $, page = 1, limit = 50,
    }) {
      return await this._makeRequest({
        $,
        method: "GET",
        path: `/catalog/brands?page=${page}&limit=${limit}`,
      });
    },
  },
};
