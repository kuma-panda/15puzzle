'use strict';

const Assert = {
     equal: function(a, b){
          if( a != b ){ throw new Error(`Assertion failed : ${a} != ${b}`)}
     },     
     ok: function(b){
          if( !b ){ throw new Error(`Assertion failed : ${b} is False`)}
     }
}

//------------------------------------------------------------------------------
class Point
{
     constructor(x, y){
          this.x = x || 0;
          this.y = y || 0;
          Assert.ok(Number.isInteger(this.x) && Number.isInteger(this.y));
     }

     toString(){
          return `(${this.x}, ${this.y})`;
     }

     valid(){
          return (0 <= this.x) && (this.x < 4) && (0 <= this.y) && (this.y < 4); 
     }

     equals(p){
          Assert.equal('Point', p.constructor.name);
          return (p.x === this.x) && (p.y === this.y);
     }

     setAsIndex(index){
          this.x = index % 4;
          this.y = Math.floor(index / 4);
     }

     clone(){
          return new Point(this.x, this.y);
     }

     offset(dx, dy){
          Assert.ok(Number.isInteger(dx) && Number.isInteger(dy));
          this.x += dx;
          this.y += dy;
     }

     toIndex(){
          return this.x + this.y * 4;
     }

     static pointToIndex(x, y){
          return x + y*4;
     }
}

//------------------------------------------------------------------------------
const BLANK    = 16;
const MV_UP    = 0;
const MV_DOWN  = 1;
const MV_LEFT  = 2;
const MV_RIGHT = 3;
const MV_END   = 4;

//------------------------------------------------------------------------------
class Puzzle
{
     //-------------------------------------------------------------------------
     constructor(ref){
          this.m_data = [];
          this.m_fixed = [];
          for( let n = 0 ; n < 16 ; n++ )
          {
               if( ref && ref.constructor.name === 'Puzzle' )
               {
                    this.m_data[n] = ref.m_data[n];
               }
               else
               {
                    this.m_data[n] = n+1;
               }
               this.m_fixed[n] = false;
          }
          this.m_recording = false;
          this.m_record = [];
     }

     //-------------------------------------------------------------------------
     dump(){
          let s = [];
          for( let n = 0 ; n < 16 ; n++ )
          {
               s.push(` ${(this.m_data[n] === BLANK)? ' ' : this.m_data[n]}`.slice(-2));
          }
          console.log('+--+--+--+--+');
          console.log(`|${s.slice(0,4).join('|')}|`);
          console.log('+--+--+--+--+');
          console.log(`|${s.slice(4,8).join('|')}|`);
          console.log('+--+--+--+--+');
          console.log(`|${s.slice(8,12).join('|')}|`);
          console.log('+--+--+--+--+');
          console.log(`|${s.slice(12,16).join('|')}|`);
          console.log('+--+--+--+--+');
     }
     
     //-------------------------------------------------------------------------
     initialize(){
          for( let n = 0 ; n < 16 ; n++ )
          {
               this.m_data[n] = n+1;
               this.m_fixed[n] = false;
          }
     }

     //-------------------------------------------------------------------------
     get data(){
          return this.m_data;
     }

     getData(p){
          if( p.constructor.name === 'Point' )
          {
               p = p.toIndex();
          }
          return this.m_data[p];
     }
     setData(p, v){
          if( p.constructor.name === 'Point' )
          {
               p = p.toIndex();
          }
          this.m_data[p] = v;
     }

     //-------------------------------------------------------------------------
     getFixed(p){
          if( p.constructor.name === 'Point' )
          {
               p = p.toIndex();
          }
          return this.m_fixed[p];
     }
     setFixed(p, v){
          if( p.constructor.name === 'Point' )
          {
               p = p.toIndex();
          }
          this.m_fixed[p] = v;
     }

     //-------------------------------------------------------------------------
     swap(array, i, j){
          let t = array[i];
          array[i] = array[j];
          array[j] = t;
     }

     //-------------------------------------------------------------------------
     isCompleted(){
          for( let n = 0 ; n < 16 ; n++ )
          {
               if( this.m_data[n] !== n+1 )
               {
                    return false;
               }
          }
          return true;
     }

     //-------------------------------------------------------------------------
     shuffle(){
          this.initialize();
          let swapCount = 0;
          for( let i = 14 ; i > 1 ; i-- )
          {
               let r = Math.floor(Math.random()*(i-1));
               this.swap(this.m_data, r, i);
               swapCount++;
          }
          if( swapCount % 2 )
          {
               this.swap(this.m_data, 0, 1);
          }
     }

     //-------------------------------------------------------------------------
     //   ptの位置にあるピースが(もしあれば)移動可能かどうか調べ、
     //   移動可能な方向を取得する
     //-------------------------------------------------------------------------
     canMove(ptTarget){
          Assert.equal('Point', ptTarget.constructor.name);

          let ptDelta = [
               new Point(0, 1),
               new Point(0, -1),
               new Point(1, 0),
               new Point(-1, 0)
          ];

          let ptBlank = this.findPiece(BLANK);
          for( let n = 0 ; n < 4 ; n++ )
          {
               let ptTmp = ptBlank.clone();
               ptTmp.offset(ptDelta[n].x, ptDelta[n].y);
               if( ptTmp.equals(ptTarget) )
               {
                    return ['up', 'down', 'left', 'right'][n];
                    // return n;
               }
          }
          // return -1;
          return null;
     }

     //-------------------------------------------------------------------------
     //   番号numberのピースのある場所を探す
     //-------------------------------------------------------------------------
     findPiece(number){
          let pt = new Point(0, 0);
          for( let i = 0 ; i < 16 ; i++ )
          {
               if( this.m_data[i] === number )
               {
                    pt.setAsIndex(i);
                    break;
               }
          }
          return pt;
     }

     //-------------------------------------------------------------------------
     //   現在の盤面で，dir方向へ移動可能なピースの番号を取得する
     //-------------------------------------------------------------------------
     getMovablePiece(dir){
          let ptDelta = [
               new Point(0, 1),
               new Point(0, -1),
               new Point(1, 0),
               new Point(-1, 0),
               new Point(0, 0)
          ];
          let ptBlank  = this.findPiece(BLANK);
          let ptTarget = ptBlank.clone();
          ptTarget.offset(ptDelta[dir].x, ptDelta[dir].y);
          return this.getData(ptTarget);
     }

     //-------------------------------------------------------------------------
     //   ピースを指定した方向へ移動する
     //   (動かすピースは現在の空白の位置と移動方向の指定で一意に決まる)
     //-------------------------------------------------------------------------
     movePiece(dir)
     {
          if( typeof(dir) === 'string' )
          {
               dir = ['up', 'down', 'left', 'right'].indexOf(dir);
               if( dir < 0 ){ dir = MV_END; }
          }

          let ptDelta = [
               new Point(0, 1),
               new Point(0, -1),
               new Point(1, 0),
               new Point(-1, 0),
               new Point(0, 0)
          ];

          let ptBlank  = this.findPiece(BLANK);
          let ptTarget = ptBlank.clone();
          ptTarget.offset(ptDelta[dir].x, ptDelta[dir].y);

          if( !ptTarget.valid() || this.getFixed(ptTarget) )
          {
               return false;
          }

          this.setData(ptBlank, this.getData(ptTarget));
          this.setData(ptTarget, BLANK);

          if( this.m_recording )
          {
               this.m_record.push(dir);
          }

          return true;
     }

     //-------------------------------------------------------------------------
     //   空白を ptAround の回りをぐるっと ptDest まで移動する
     //-------------------------------------------------------------------------
     moveBlankAround(ptDest, ptAround){
          let s = [
               new Point(1, 0), 
               new Point(1, 1),
               new Point(0, 1),
               new Point(-1, 1),
               new Point(-1, 0),
               new Point(-1, -1),
               new Point(0, -1),
               new Point(1, -1)
          ];

          let ptBlank = this.findPiece(BLANK);
          if( ptBlank.equals(ptDest) )
          {
               return;
          }

          // ゴールの方向を探す
          let dir = -1;
          for( let i = 0 ; i < 8 ; i++ )
          {
               let p = ptAround.clone();
               p.offset(s[i].x, s[i].y);
               if( p.equals(ptBlank) )
               {
                    dir = i;
                    break;
               }
          }
          Assert.ok(dir !== -1);

          // 左回りに距離を数える
          let LF = -1;
          for( let i = 0 ; i < 8 ; i++ )
          {
               let d = (dir + 8 - i) % 8;
               let p = ptAround.clone();
               p.offset(s[d].x, s[d].y);
               if( !p.valid() || this.getFixed(p) )
               {
                    LF = 999;
                    break;
               }
               if( p.equals(ptDest) )
               {
                    LF = i;
                    break;
               }
          }

          // 右回りに距離を数える
          let RF = -1;
          for( let i = 0 ; i < 8 ; i++ )
          {
               let d = (dir + i) % 8;
               let p = ptAround.clone();
               p.offset(s[d].x, s[d].y);
               if( !p.valid() || this.getFixed(p) )
               {
                    RF = 999;
                    break;
               }
               if( p.equals(ptDest) )
               {
                    RF = i;
                    break;
               }
          }
          Assert.ok((LF !== -1) || (RF !== -1));
          Assert.ok((LF !== 999) || (RF !== 999));

          // 左右、近い方の回りかたを採用する
          if( LF < RF )
          {
               let mv = [MV_DOWN, MV_RIGHT, MV_RIGHT, MV_UP, MV_UP, MV_LEFT, MV_LEFT, MV_DOWN];
               for( let i = 0 ; i < LF ; i++ )
               {
                    this.movePiece(mv[(i + 8 - dir) % 8]);
               }
          }
          else
          {
               let mv = [MV_UP, MV_RIGHT, MV_RIGHT, MV_DOWN, MV_DOWN, MV_LEFT, MV_LEFT, MV_UP];
               for( let i = 0 ; i < RF ; i++ )
               {
                    this.movePiece(mv[(i + dir) % 8]);
               }
          }
     }

     //-------------------------------------------------------------------------
     //   空白を ptDest まで可能なかぎり移動する
     //-------------------------------------------------------------------------
     moveBlankStraight(ptDest){
          let bRet;
          do
          {
               bRet = false;
               let ptBlank = this.findPiece(BLANK);
               if( ptBlank.equals(ptDest) )
               {
                    break;
               }

               if( ptBlank.y > ptDest.y )
               {
                    if( this.movePiece(MV_DOWN) ){ bRet = true; }
               }
               if( !bRet && ptBlank.x > ptDest.x )
               {
                    if( this.movePiece(MV_RIGHT) ){ bRet = true; }
               }
               if( !bRet && ptBlank.y < ptDest.y )
               {
                    if( this.movePiece(MV_UP) ){ bRet = true; }
               }
               if( !bRet && ptBlank.x < ptDest.x )
               {
                    if( this.movePiece(MV_LEFT) ){ bRet = true; }
               }
          }
          while( bRet );
     }

     //-------------------------------------------------------------------------
     //   ptTarget を移動するために、空白を ptDest まで移動する
     //-------------------------------------------------------------------------
     moveBlank(ptDest, ptTarget){
          this.moveBlankStraight(ptDest);
          this.moveBlankAround(ptDest, ptTarget);
     }

     //-------------------------------------------------------------------------
     //   番号cのピースを ptDst(x,y) まで移動する
     //   まず、動きたい方向に空白を移動し、
     //   次に、そちらにコマを動かす
     //-------------------------------------------------------------------------
     movePieceOfNumber(number, ptDest){
          let ptTarget = new Point(0, 0);
          let ptTemp = new Point(0, 0);
          let dir;

          while( true )
          {
               let r = false;
               ptTarget = this.findPiece(number);
               if( ptTarget.equals(ptDest) )
               {
                    break;
               }
               if( ptTarget.y > ptDest.y )
               {
                    ptTemp.x = ptTarget.x;
                    ptTemp.y = ptTarget.y - 1;
                    dir = MV_UP;
                    if( !this.getFixed(ptTemp) )
                    {
                         r = true;
                    }
               }
               if( !r && ptTarget.x > ptDest.x )
               {
                    ptTemp.x = ptTarget.x - 1;
                    ptTemp.y = ptTarget.y;
                    dir = MV_LEFT;
                    if( !this.getFixed(ptTemp) )
                    {
                         r = true;
                    }
               }
               if( !r && ptTarget.x < ptDest.x)
               {
                    ptTemp.x = ptTarget.x + 1;
                    ptTemp.y = ptTarget.y;
                    dir = MV_RIGHT;
                    if( !this.getFixed(ptTemp) )
                    {
                         r = true;
                    }
               }
               Assert.ok(r);

               this.setFixed(ptTarget, true);
               this.moveBlank(ptTemp, ptTarget);
               this.setFixed(ptTarget, false);
               this.movePiece(dir);
          }
     }

     //-------------------------------------------------------------------------
     //   2つのピースの位置を入れ替える
     //
     //   4 3       3 4
     //   a     →    b
     //   b c       a c
     //-------------------------------------------------------------------------
     swapProcH(){
          let seq = [
               MV_DOWN, MV_RIGHT, MV_UP, MV_UP, MV_LEFT, MV_DOWN,
               MV_RIGHT, MV_DOWN, MV_LEFT, MV_UP, MV_UP, MV_RIGHT,
               MV_DOWN, MV_LEFT, MV_DOWN, MV_RIGHT, MV_UP,
               MV_END
          ];
          for( let i = 0 ; seq[i] !== MV_END ; i++ )
          {
               this.movePiece(seq[i]);
          }
     }
     //-------------------------------------------------------------------------
     //   13 a b       9   a
     //    9   c  →  13 b c
     //-------------------------------------------------------------------------
     swapProcV(){
          let seq = [
               MV_RIGHT, MV_DOWN, MV_LEFT, MV_LEFT, MV_UP, MV_RIGHT,
               MV_DOWN, MV_RIGHT, MV_UP, MV_LEFT, MV_LEFT, MV_DOWN,
               MV_RIGHT, MV_UP, MV_RIGHT, MV_DOWN, MV_LEFT,
               MV_END
          ];
          for( let i = 0 ; seq[i] !== MV_END ; i++ )
          {
               this.movePiece(seq[i]);
          }
     }

     //-------------------------------------------------------------------------
     //   第１行をそろえる
     //   →1 2 3 4
     //     * * * *
     //     * * * *
     //     * * * *
     //-------------------------------------------------------------------------
     solve1stRow(){
          // [1]を移動
          this.movePieceOfNumber(1, new Point(0, 0));
          this.setFixed(0, true);

          // [2]を移動
          this.movePieceOfNumber(2, new Point(1, 0));
          this.setFixed(1, true);

          if( this.getData(new Point(2, 0)) !== 3 || this.getData(new Point(3, 0)) !== 4 )
          {
               this.movePieceOfNumber(4, new Point(2, 0));
               this.setFixed(new Point(2, 0), true);
               let pt3 = this.findPiece(3);
               let ptBlank = this.findPiece(BLANK);
               if( (pt3.x === 3) && ((pt3.y === 0) || ((pt3.y === 1) && (ptBlank.equals(new Point(3, 0))))) )
               {
                    this.moveBlank(new Point(3, 0), new Point(2, 0));    // 1 2 4 3 の場合
                    this.setFixed(new Point(2, 0), false);
                    this.swapProcH();   // 入れ替え
               }
               else
               {
                    this.movePieceOfNumber(3, new Point(2, 1));                 // 次のパターンを目標にする
                    this.setFixed(new Point(2, 1), true);                       //   1 2 4
                    this.moveBlank(new Point(3, 0), new Point(2, 1));           //   * * 3 *
                    this.setFixed(new Point(2, 0), false);                      //   * * * *
                    this.setFixed(new Point(2, 1), false);                      //   * * * *
                    this.movePiece(MV_RIGHT);
                    this.movePiece(MV_UP);                       // これで 1 2 3 4 になる
               }
          }
          this.setFixed(2, true);
          this.setFixed(3, true);
     }

     //-------------------------------------------------------------------------
     //   第２行をそろえる
     //     1 2 3 4
     //   →5 6 7 8
     //     * * * *
     //     * * * *
     //-------------------------------------------------------------------------
     solve2ndRow(){
          this.movePieceOfNumber(5, new Point(0, 1));
          this.setFixed(4, true);
          this.movePieceOfNumber(6, new Point(1, 1));
          this.setFixed(5, true);

          if( this.getData(new Point(2, 1)) !== 7 || this.getData(new Point(3, 1)) !== 8 )
          {
               this.movePieceOfNumber(8, new Point(2, 1));
               this.setFixed(new Point(2, 1), true);
               let pt7 = this.findPiece(7);
               let ptBlank = this.findPiece(BLANK);
               if( (pt7.x === 3) && ((pt7.y === 1) || ((pt7.y === 2) && ptBlank.equals(new Point(3, 1)))) )
               {
                    this.moveBlank(new Point(3, 1), new Point(2, 1));    // 5 6 8 7 の場合
                    this.setFixed(new Point(2, 1), false);
                    this.swapProcH();   // 入れ替え
               }
               else
               {
                    this.movePieceOfNumber(7, new Point(2, 2));                 //  1 2 3 4
                    this.setFixed(new Point(2, 2), true);                       //  5 6 8
                    this.moveBlank(new Point(3, 1), new Point(2, 2));           //  * * 7 *
                    this.setFixed(new Point(2, 1), false);                      //  * * * *   にする
                    this.setFixed(new Point(2, 2), false);
                    this.movePiece(MV_RIGHT);
                    this.movePiece(MV_UP);             // これで 5 6 7 8 が完成
               }
     }
     this.setFixed(new Point(2, 1), true);
     this.setFixed(new Point(3, 1), true);
     }

     //-------------------------------------------------------------------------
     //   左下をそろえる
     //     1 2 3 4
     //     5 6 7 8
     //     9 * * *
     //    13 * * *
     //    ↑
     //-------------------------------------------------------------------------
     solveBottomLeft1(){
          this.movePieceOfNumber(13, new Point(0, 2));
          this.setFixed(new Point(0, 2), true);
          let pt = this.findPiece(9);
          if( (pt.y === 3) && ((pt.x === 0) || ((pt.x === 1) &&  this.findPiece(BLANK).equals(new Point(0, 3)))) )
          {
               this.moveBlank(new Point(0, 3), new Point(0, 2));      // 13
               this.setFixed(new Point(0, 2), false);                 //  9 の場合
               this.swapProcV();   // 入れ替え
          }
          else
          {
               this.movePieceOfNumber(9, new Point(1, 2));            //   1 2 3 4
               this.setFixed(new Point(1, 2), true);                  //   5 6 7 8
               this.moveBlank(new Point(0, 3), new Point(1, 2));      //  13 9 * *
               this.setFixed(new Point(0, 2), false);                 //     * * *  にする
               this.setFixed(new Point(1, 2), false);
               this.movePiece(MV_DOWN);      // これで  9
               this.movePiece(MV_LEFT);      //        13   になる
          }
          this.setFixed(new Point(0, 2), true);
          this.setFixed(new Point(0, 3), true);
     }

     //-------------------------------------------------------------------------
     //   左下第２列をそろえる
     //       1  2 3 4
     //       5  6 7 8
     //       9 10 * *
     //      13 14 * *
     //         ↑
     //-------------------------------------------------------------------------
     solveBottomLeft2()
     {
          this.movePieceOfNumber(14, new Point(1, 2));
          this.setFixed(new Point(1, 2), true);
          let pt = this.findPiece(10);
          if( (pt.y === 3) && ((pt.x === 1) || ((pt.x === 2) && this.findPiece(BLANK).equals(new Point(1, 3)))) )
          {
               this.moveBlank(new Point(1, 3), new Point(1, 2));    // 14
               this.setFixed(new Point(1, 2), false);             // 10 の場合
               this.swapProcV();   // 入れ替える
          }
          else
          {
               this.movePieceOfNumber(10, new Point(2, 2));                //   1  2  3  4
               this.setFixed(new Point(2, 2), true);                       //   5  6  7  8
               this.moveBlank(new Point(1, 3), new Point(2, 2));           //   9 14 10  *
               this.setFixed(new Point(1, 2), false);                      //  13     *  * にする
               this.setFixed(new Point(2, 2), false);
               this.movePiece(MV_DOWN);      // これで  10
               this.movePiece(MV_LEFT);      //         14 になる
          }
          this.setFixed(new Point(1, 2), true);
          this.setFixed(new Point(1, 3), true);
     }

     //-------------------------------------------------------------------------
     //   右下をそろえる
     //     1  2  3  4
     //     5  6  7  8
     //     9 10 11 12 ←
     //    13 14 15
     //          ↑
     //-------------------------------------------------------------------------
     solveBottomRight(){
          let seq = [MV_RIGHT, MV_DOWN, MV_LEFT, MV_UP];
          for( let i = 0 ; ; i++ )
          {
               // 揃うまで右回りに移動する
               if( this.findPiece(BLANK).equals(new Point(3, 3)) && this.getData(new Point(2, 2)) === 11 )
               {
                    break;
               }
               this.movePiece(seq[i % 4]);
          }
     }

     //-------------------------------------------------------------------------
     solve()
     {
          let pClone = new Puzzle(this);
          pClone.m_recording = true;
          pClone.solve1stRow();
          pClone.solve2ndRow();
          pClone.solveBottomLeft1();
          pClone.solveBottomLeft2();
          pClone.solveBottomRight();
          return pClone.m_record;
     }
}

//------------------------------------------------------------------------------
//module.exports = Puzzle;
