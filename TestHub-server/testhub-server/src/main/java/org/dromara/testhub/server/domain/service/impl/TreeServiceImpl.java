package org.dromara.testhub.server.domain.service.impl;

import cn.dev33.satoken.stp.StpUtil;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.dromara.testhub.framework.exception.TestHubException;
import org.dromara.testhub.nsrule.core.executer.context.RuleConfig;
import org.dromara.testhub.plugins.http.server.repository.po.HttpTreeNodePo;
import org.dromara.testhub.plugins.http.server.util.TreeUtil;
import org.dromara.testhub.sdk.action.dto.req.TreeDirDto;
import org.dromara.testhub.sdk.action.dto.res.TreeNodeResDto;
import org.dromara.testhub.sdk.action.dto.res.TreeNodeResDto2;
import org.dromara.testhub.server.core.rule.CacheManager;
import org.dromara.testhub.server.core.rule.DbManager;
import org.dromara.testhub.server.domain.convert.TreeInfoConvert;
import org.dromara.testhub.server.domain.dto.req.other.RenameDto;
import org.dromara.testhub.server.domain.dto.req.other.TreeInfoReqDto;
import org.dromara.testhub.server.domain.dto.res.rule.RuleProjectResDto;
import org.dromara.testhub.server.domain.service.TreeService;
import org.dromara.testhub.server.domain.util.CaseTreeUtil;
import org.dromara.testhub.server.infrastructure.repository.dao.TreeInfoMapper;
import org.dromara.testhub.server.infrastructure.repository.dao.UserMapper;
import org.dromara.testhub.server.infrastructure.repository.po.TreeInfoPo;
import org.dromara.testhub.server.infrastructure.repository.po.UserPo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Slf4j
@Service("treeService")
public class TreeServiceImpl implements TreeService {
    @Autowired
    private RuleConfig ruleConfig;
    @Autowired
    private DbManager dbManager;
    @Autowired
    private RuleConfig config;
    @Autowired
    private TreeInfoMapper treeInfoMapper;
    @Autowired
    private TreeInfoConvert treeInfoConvert;
    @Autowired
    private UserMapper userMapper;


    @Override
    public Map<String, TreeNodeResDto2> getCaseTree(String projectCode) {
        if (CacheManager.getProject(projectCode) == null) {
            throw new TestHubException("找不到所属项目");
        }
        RuleProjectResDto projectResDto = CacheManager.getProject(projectCode);
        List<TreeNodeResDto> ruleTrees = projectResDto.getRuleTrees();
        //先解析出来吧
        List<TreeNodeResDto> ruleTreesAll = CaseTreeUtil.collectAllNodes(ruleTrees);

        return CaseTreeUtil.convert2(ruleTreesAll);
    }

    @Override
    public TreeNodeResDto2 saveCaseTree(TreeDirDto reqDto, String model) {
        if (StringUtils.isEmpty(reqDto.getProjectCode()) || ruleConfig.getProject(reqDto.getProjectCode()) == null) {
            throw new TestHubException("找不到所属项目:" + reqDto.getProjectCode());
        }
        TreeInfoPo po = treeInfoConvert.reqDir2po(reqDto);
        save(po,model,reqDto.getProjectCode());
        TreeNodeResDto2 treeNodeResDto2 = CaseTreeUtil.getTreeNodeResDto(po);
        CacheManager.reBuildTreeNode(dbManager,config,reqDto.getProjectCode());
        return treeNodeResDto2;
    }

    private void save(TreeInfoPo po, String model,String projectCode){
        boolean update = "update".equalsIgnoreCase(model);
        if (po.getParentId() != 0) {
            //0表示根节点
            TreeInfoPo parent = treeInfoMapper.selectById(po.getParentId());
            if(parent==null){
                throw new TestHubException("找不到父节点的ID");
            }
            po.setTreeType(parent.getTreeType());
        }else {
            po.setTreeType(projectCode+"_CASE");
        }
        if (update) {
            treeInfoMapper.updateById(po);
        } else {
            treeInfoMapper.insert(po);
        }
    }

    @Override
    public TreeNodeResDto2 rename(RenameDto renameDto) {
        TreeInfoPo po = treeInfoMapper.selectById(Long.parseLong(renameDto.getKey()));
        if(po==null){
            throw new TestHubException("找不到类目");
        }
        po.setName(renameDto.getName());
        treeInfoMapper.updateById(po);
        CacheManager.reBuildTreeNode(dbManager,config,po.getTreeType().substring(0,po.getTreeType().lastIndexOf("_")));
        return CaseTreeUtil.getTreeNodeResDto(po);
    }

    @Override
    @Transactional
    public TreeNodeResDto save(TreeInfoReqDto treeInfoReqDto) {
        String projectCode = treeInfoReqDto.getTreeType().substring(0,treeInfoReqDto.getTreeType().lastIndexOf("_"));
        if(CacheManager.getProject(projectCode)==null){
            throw new TestHubException("找不到所属项目");
        }
        if(treeInfoReqDto.getParentId()!=0){
            //0表示根节点
            TreeInfoPo parent = treeInfoMapper.selectById(treeInfoReqDto.getParentId());
            if(parent==null){
                throw new TestHubException("找不到父节点的ID");
            }
            if(!parent.getTreeType().equals(treeInfoReqDto.getTreeType())){
                throw new TestHubException("树类型不一致");
            }
            treeInfoReqDto.setTreeType(parent.getTreeType());
        }
        TreeInfoPo newTreeInfoPo = treeInfoConvert.req2po(treeInfoReqDto);
        treeInfoMapper.insert(newTreeInfoPo);
        CacheManager.reBuildTreeNode(dbManager,config,projectCode);
        return treeInfoConvert.po2Res(newTreeInfoPo);
    }

    @Override
    @Transactional
    public TreeNodeResDto update(Long id, TreeInfoReqDto treeInfoReqDto) {
        TreeInfoPo oldTreeInfoPo = treeInfoMapper.selectById(id);
        if(oldTreeInfoPo==null){
            throw new TestHubException("找不到树");
        }
        if(oldTreeInfoPo.getCreateUserId()!=Long.parseLong(StpUtil.getLoginId().toString())){
            UserPo userPo = userMapper.selectById(oldTreeInfoPo.getCreateUserId());
            if(userPo==null){
                throw new TestHubException("只能修改个人新增的类目");
            }else {
                throw new TestHubException("只能修改个人新增的类目，请联系："+userPo.getUserName());
            }
        }
        if(treeInfoReqDto.getParentId()!=oldTreeInfoPo.getParentId()){
            //0表示根节点
            if(treeInfoReqDto.getParentId()!=0){
                TreeInfoPo parent = treeInfoMapper.selectById(treeInfoReqDto.getParentId());
                if(parent==null){
                    throw new TestHubException("找不到父节点的ID");
                }
            }
            oldTreeInfoPo.setParentId(treeInfoReqDto.getParentId());
        }

        if(StringUtils.isNotEmpty(treeInfoReqDto.getName())){
            oldTreeInfoPo.setName(treeInfoReqDto.getName());
        }
        treeInfoMapper.updateById(oldTreeInfoPo);

        CacheManager.reBuildTreeNode(dbManager,config,oldTreeInfoPo.getTreeType().substring(0,oldTreeInfoPo.getTreeType().lastIndexOf("_")));
        return treeInfoConvert.po2Res(oldTreeInfoPo);
    }
}
