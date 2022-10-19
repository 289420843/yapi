import React, { PureComponent as Component } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { Checkbox, Modal } from 'antd';
import { Form, Select, Input, Button, Row, Col } from 'antd';
const plugin = require('client/plugin.js');
import db from 'client/utils/db';
const Methods = ['get', 'post', 'put'];
const importDataModule = {};
const ImportSwaggerModal = Form.create({ name: 'ImportSwaggerModal' })(
  class ImportSwagger extends Component {
    static propTypes = {
      setting: PropTypes.object,
      visible: PropTypes.bool,
      onCancel: PropTypes.func,
      onSuccess: PropTypes.func,
      form: PropTypes.object
    };

    constructor(props) {
      super(props);
      this.state = {
        setting: this.props.setting,
        loading: false,
        cache: false
      };
    }
    componentWillMount() {
      plugin.emitHook('import_data', importDataModule);
      db.getItem('cache').then(value => {
        this.setState({
          cache: value === 'true'
        });
      });
    }
    getJson(url) {
      return new Promise((resolve, reject) => {
        if (this.state.cache) {
          // 如果使用缓存 判断当前缓存的json是否一致
          const cache_json_url = db.getItem('cache_json_url');
          const cache_json = db.getItem('cache_json');
          if (cache_json && cache_json_url === url) {
            // 使用缓存
            return resolve(JSON.parse(cache_json));
          }
        }

        axios.get(url).then(({ data }) => {
          db.setItem('cache_json_url', url);
          db.setItem('cache_json', JSON.stringify(data));
          resolve(data);
        });
      });
    }
    handleSubmit = () => {
      this.props.form.validateFields((errors, value) => {
        if (!errors) {
          this.setState({
            loading: true
          });
          this.getJson(value.json_url)
            .then(async data => {
              const res = await importDataModule['swagger'].run(data);
              const api = res.apis.find(
                item =>
                  item.path === value.path &&
                  item.method.toLowerCase() === value.method.toLowerCase()
              );
              if (api) {
                if (!api.req_body_other) {
                  api.req_body_type = 'json';
                }
              }
              this.props.onSuccess(api, value);
            })
            .finally(() => {
              this.setState({
                loading: false
              });
            });
        }
      });
    };
    requiredStr = () => {
      return [
        {
          required: true
        }
      ];
    };
    render() {
      const formItemLayout = {
        labelCol: { span: 8 },
        wrapperCol: { span: 16 }
      };
      const { getFieldDecorator } = this.props.form;
      return (
        <Modal
          title='导入swagger'
          visible={this.props.visible}
          onCancel={this.props.onCancel}
          footer={null}
          width={1200}
        >
          <div style={{ padding: '0px 20px' }}>
            <Form ref={ref => (this.formRef = ref)}>
              <Row>
                <Col span='6'>
                  <Form.Item className='interface-edit-item' {...formItemLayout} label='json_url'>
                    {getFieldDecorator('json_url', {
                      initialValue: this.props.setting.json_url,
                      rules: this.requiredStr()
                    })(<Input id='json_url' placeholder='json_url' />)}
                  </Form.Item>
                </Col>
                <Col span='6'>
                  <Form.Item className='interface-edit-item' {...formItemLayout} label='path'>
                    {getFieldDecorator('path', {
                      initialValue: this.props.setting.path,
                      rules: this.requiredStr()
                    })(<Input id='path' placeholder='path' />)}
                  </Form.Item>
                </Col>
                <Col span='6'>
                  <Form.Item className='interface-edit-item' {...formItemLayout} label='method'>
                    {getFieldDecorator('method', {
                      initialValue: this.props.setting.method,
                      rules: this.requiredStr()
                    })(
                      <Select placeholder='method'>
                        {Methods.map(name => {
                          return (
                            <Select.Option key={name} value={name}>
                              {name}
                            </Select.Option>
                          );
                        })}
                      </Select>
                    )}
                  </Form.Item>
                </Col>
                <Col span='6'>
                  <Form.Item style={{ textAlign: 'right' }}>
                    <Checkbox
                      checked={this.state.cache}
                      onChange={e => {
                        const checked = e.target.checked;
                        this.setState({
                          cache: checked
                        });
                        db.setItem('cache', checked ? 'true' : 'false');
                      }}
                      style={{ marginRight: '10px' }}
                    >
                      缓存
                    </Checkbox>

                    <Button
                      type='primary'
                      disabled={this.state.loading}
                      onClick={this.handleSubmit}
                    >
                      {this.state.loading ? '正在解析' : '解析'}
                    </Button>
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </div>
        </Modal>
      );
    }
  }
);

export default ImportSwaggerModal;
