import Idb from 'idb-js';
const config = {
  dbName: 'YAPILocalData', // *数据库名称
  version: 3, // 数据库版本号（默认为当前时间戳）
  tables: [
    {
      tableName: 'storageMap',
      option: { keyPath: 'key' },
      indexs: [
        {
          key: 'key',
          // 索引配置，此处表示该字段不允许重复
          unique: true
        },
        {
          key: 'value'
        }
      ]
    }
  ]
};

class MyDB {
  getDb = async function (db) {
    if (db) {
      return db;
    }
    db = await Idb(config);
    return db;
  };
  getItem(key, db) {
    const idClose = !db;
    return new Promise((resolve, reject) => {
      this.getDb(db).then(db => {
        // 先查询是否存在
        db.query({
          tableName: 'storageMap',
          condition: item => item.key === key,
          success: list => {
            if (list.length == 1) {
              resolve(list[0].value);
            } else {
              resolve(null);
            }
            if (idClose) {
              db.close_db();
            }
          }
        });
      });
    });
  }
  setItem(key, value) {
    return new Promise((resolve, reject) => {
      this.getDb()
        .then(async db => {
          const query = await this.getItem(key, db);
          if (query) {
            db.update({
              tableName: 'storageMap',
              condition: item => item.key === key,
              handle: r => {
                r.value = value;
              },
              success: () => {
                resolve(true);
                db.close_db();
              }
            });
          } else {
            db.insert({
              tableName: 'storageMap',
              data: {
                key,
                value
              },
              success: () => {
                resolve(true);
                db.close_db();
              }
            });
          }
        })
        .catch(reject);
    });
  }
}
const db = new MyDB();

export default db;
